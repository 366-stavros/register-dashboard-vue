import express from 'express'
import http from 'http'
import fileUpload from 'express-fileupload'
import { readFileSync } from 'fs'
import parse from 'csv-parse'
import { withReference, zip } from './util'
import socket from 'socket.io'
import axios from 'axios'
import faker from 'faker'
import { EventEmitter } from 'events'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const path = __dirname + '/app/views/'
const app = express();

app.use(express.static(path));
app.use(express.json())
app.use(fileUpload());

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.post('/upload', (req, res) => {
  if (req['files'] == undefined || req['files'] == null) {
    res.send('Error')
    return
  }
  parse(req['files'].csv.data.toString(), {
    comment: '#'
  }, (err, output: string[][]) => {
    res.send(withReference(output.map(record => record.map(field => field.trim())), cleaned_output =>
      withReference<[string[], string[][]], any>([cleaned_output[0], cleaned_output.slice(1)], ([fieldNames, tableData]) =>
        tableData.map(record => Object.fromEntries(zip(fieldNames, record))))))
  })
})

const server = app.listen(8000, () => {
  console.log(`Csv server started at http://localhost:8000`);
})

const registerClient = async (client: any, data: any): Promise<'Success' | { error: string }> => {
  let headers = {
    'Content-Type': 'application/json',
  }
  headers[data.auth.key] = data.auth.value
  if (data.extra_headers)
    data.extra_headers.forEach(header => {
      headers[header.key] = header.value
    })
  const res = await axios.post(data.endpoint, { ...client }, {
    headers: headers
  }).catch(err => {
    try {
      return ({ error: err.response.data.message })
    } catch {
      console.log(err)
      return ({ error: err })
    }
  })
  return res['error'] || res['error'] == '' ? ({ error: res['error'] == '' ? 'Empty reply from server' : res['error'] }) : 'Success'
}

const io = new socket.Server(server)
let cancel_socket = null

io.on('connection', async socket => {
  console.log('connected')
  socket.on('abort', () => {
    socket.emit('error', 'Aborted')
    cancel_socket = socket
  })

  socket.on('handshake', async data => {
    console.log('got data')
    if(data.endpoint == null || data.endpoint == '') {
      socket.emit('error', 'Endpoint is empty')
      return
    }
    if(!data.auth || !data.auth.key || data.auth.key == '' || !data.auth.value || data.auth.value == '') {
      socket.emit('error', 'Auth is empty')
      return
    }
    const clients = data.users
    if (data.is_async) {
      let count = 0
      const myEmitter = new EventEmitter();
      myEmitter.on('inc', () => {
        if(count == data.users.length - 1) {
          socket.emit('completed', {})
        } else {
          count++
        }
      })
      clients.forEach(async client => {
        const res = await registerClient(({ ...client, password: faker.internet.password(), portal: data.userType == 'Client' ? '1' : '2' }), data)
        socket.emit('logdata', {email: client['email'], result: JSON.stringify(res === 'Success' ? res : res.error)})
        console.log(client['email'], JSON.stringify(res === 'Success' ? res : res.error))
        myEmitter.emit('inc', {})
      })      
    } else {
      for (let client of clients) {
        if (cancel_socket != null) {
          cancel_socket = null
          socket.disconnect()
          break
        }
        const res = await registerClient(({ ...client, password: faker.internet.password(), portal: data.userType == 'Client' ? '1' : '2' }), data)
        socket.emit('logdata', {email: client['email'], result: JSON.stringify(res === 'Success' ? res : res.error)})
        console.log(client['email'], JSON.stringify(res === 'Success' ? res : res.error))
        if(data.wait_time && data.wait_time != '') {
          await sleep(Number.parseInt(data.wait_time))
        }
      }
      socket.emit('completed', {})
    }
  })
})
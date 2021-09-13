<template>
  <div class='main-wrapper'>

  <div v-if="!uploaded" class="uploader-container">
    <form enctype="multipart/form-data">
      <md-card md-with-hover>
        <md-card-header>
          <div class="md-title">Upload CSV</div>
        </md-card-header>

        <md-card-content> Click the button to upload your csv </md-card-content>

        <md-card-actions>
          <md-field>
            <md-file v-on:change="handleUpload" id="csv" />
            <md-button v-on:click="handleClick">Upload</md-button>
          </md-field>
        </md-card-actions>
      </md-card>
    </form>
  </div>

  <div v-else class="app">
     <md-app md-waterfall md-mode="fixed-last">
       <md-app-toolbar class='md-large md-dense md-primary'>
         <div class="md-toolbar-row">
           <div class="md-toolbar-section-start">
         <span class='md-title'>{{ current_tab }}</span>
         </div>
         <div class="md-toolbar-section-end">
         </div>
         </div>
         <div class="md-toolbar-row">
          <md-tabs class="md-primary">
            <md-tab md-label="Records" v-on:click="current_tab = 'Records'"></md-tab>
            <md-tab md-label="Settings" v-on:click="current_tab = 'Settings'"></md-tab>
            <md-tab md-label="Execute" v-on:click="executeScreen = 1"></md-tab>

              <md-dialog :md-active.sync="executeScreen">

      <md-tabs >
        <md-tab md-label="General">
          <p>User Type: {{ user_type }}</p>
          <p>Async Mode: {{ async_mode }} </p>
          <p>Number of records => {{ users.length }}</p>
          <p>Endpoint => {{ endpoint }}</p>
          <p>Auth => {{ auth_key != '' ? `${auth_key}: ${auth_value}` : ''}}</p>
          <p>Extra Headers<br/> {{ extra_headers }}</p>
        </md-tab>
        <md-tab md-label="Logs">
          <md-field>
            <md-textarea v-model="logs" disabled></md-textarea>
          </md-field>
        </md-tab>
      </md-tabs>

      <md-dialog-actions>
        <md-button v-if="!is_executing" class="md-primary" @click="execute">Execute</md-button>
        <md-button v-else class="md-primary" @click="abort">Abort</md-button>
        <md-button class="md-primary" @click="logs = ''">Clear Logs</md-button>
        <md-button class="md-primary" @click="executeScreen = false">Close</md-button>
      </md-dialog-actions>
    </md-dialog>

          </md-tabs>
        </div>
       </md-app-toolbar>
      <md-app-content>
      <div v-if="current_tab == 'Records'">
       <md-field>
      <label>records = records.filter(record => </label>
      <md-input v-model="filter" placeholder="Type your filter here" v-on:change='handleFilterChange'></md-input>
    </md-field>
    <md-field>
      <label>records = records.map(record => </label>
      <md-input v-model="mapping" placeholder="Type your mapping here" v-on:change='handleMappingChange'></md-input>
    </md-field>
        <div class="table">
              <md-table
                v-model="users"
                md-sort="email"
                md-sort-order="asc"
                @md-selected="onSelect"
              >
                <md-table-row slot="md-table-row" slot-scope="{ item }">
                  <md-table-cell
                    v-for="fieldName in fieldNames"
                    :key="fieldName"
                    :md-label="fieldName"
                    :md-sort-by="fieldName"
                    md-selectable="single"
                    >{{ item[fieldName] }}</md-table-cell
                  >
                </md-table-row>
              </md-table>
            </div>
      </div>
      <div v-if="current_tab == 'Settings'">
        <div class='inline'>
          <md-radio v-for="userType in ['Client','Affiliate']" :key='userType' v-model="user_type" :value='userType'> {{ userType }} </md-radio>
            <md-switch v-model="async_mode" class="md-primary">Execute Asynchronously</md-switch>
        </div>
        <div>
          <table>
            <tr>
              <td>
                <md-card md-with-hover style='width:auto'>
                <md-card-header>
                  <div class='md-title'>Authentication</div>
                </md-card-header>
                <md-card-content>
                  <div class='inline'>
                    <md-field v-for="[auth_label,auth_key] in [['Key','auth_key'],['Value','auth_value']]" :key='auth_key'>
                      <label>{{ auth_label }}</label>
                      <md-input v-on:change="handleChange" :name="auth_key" :value='getModel(auth_key)'></md-input>
                    </md-field>
                  </div>
                </md-card-content>
              </md-card>
              </td>
              <td>
                <md-card md-with-hover style='width:28vw'>
                <md-card-header>
                  <div class='md-title'>Endpoint</div>
                </md-card-header>
                <md-card-content>
                    <md-field>
                      <label>Register Endpoint</label>
                      <md-input v-model="endpoint"></md-input>
                    </md-field>
                </md-card-content>
              </md-card>
              </td>
              <td>
                <md-card md-with-hover style='width:auto'>
                <md-card-header>
                  <div class='md-title'>Add Header</div>
                </md-card-header>
                <md-card-content>
                    <div class='inline'>
                    <md-field v-for="[label,key] in [['Key','header_key'],['Value','header_value']]" :key='key'>
                      <label>{{ label }}</label>
                      <md-input v-on:change="handleChange" :name="key" :value='getModel(key)'></md-input>
                    </md-field>
                      <md-button class="md-raised md-primary" style='transform: translateY(30%)' v-on:click='addHeader'>Add</md-button>
                  </div>
                </md-card-content>
              </md-card>
              </td>
              </tr>
              <tr v-if="extra_headers && extra_headers.length > 0">
                <td>
                </td>
                <td>
                </td>
                <td>
                <md-card md-with-hover style='width:auto'>
                  <md-card-content>
              <md-table
                v-model="extra_headers"
                md-sort="Key"
                md-sort-order="asc"
                @md-selected="onSelect"
              >
                    <md-table-toolbar>
                      <h1 class="md-title">Extra Headers</h1>
                    </md-table-toolbar>

                <md-table-row slot="md-table-row" slot-scope="{ item }">
                  <md-table-cell 
                    aria-colspan="3"
                    md-label="Key"
                    md-sort-by="key"
                    >{{ item.key }}</md-table-cell
                  >
                   <md-table-cell
                    md-label="Value"
                    md-sort-by="value"
                    >{{ item.value }}</md-table-cell
                  >
                  <md-table-cell
                    md-label=""
                    >
                    <md-button class="md-raised md-accent" v-on:click="handleDelete(item)">Delete</md-button>
                  </md-table-cell
                  >
                </md-table-row>
              </md-table>
                  </md-card-content>
                </md-card>
                </td>
              </tr>
          </table>
            </div>
          </div>
      </md-app-content>
     </md-app>
    </div>
</template>

<style>
.uploader-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.table {
  height: 100vh;
  width: 100vw;
}
.inline {
  display: flex;
  justify-content: left;
  column-gap: 10px;
}
</style>

<script>
import "vue-material/dist/vue-material.min.css";
import axios from "axios";
import { io } from "socket.io-client";

export default {
  name: "Home",
  methods: {
    handleUpload(val) {
      this.csv = val.target.files[0];
    },
    async handleClick() {
      const formData = new FormData();
      formData.append("csv", this.csv);
      const reply = await axios.post("/upload", formData);
      this.uploaded = true;
      this.users = reply.data;
      this.fieldNames = Object.keys(reply.data[0]);
    },
    getModel(val) {
      return this[val]
    },
    addHeader(val) {
      if (this.header_key == "" || this.header_value == "") return;
      const header = { key: this.header_key, value: this.header_value };
      if (this.extra_headers == null) this.extra_headers = [header];
      else {
        this.extra_headers.push(header);
      }
      function onlyUnique(value, index, self) {
        return (
          self.map((r) => JSON.stringify(r)).indexOf(JSON.stringify(value)) ==
          index
        );
      }
      this.extra_headers = this.extra_headers.filter(onlyUnique);
    },
    handleFilterChange(event) {
      eval(`this.users = this.users.filter(record => ${event.target.value})`);
    },
    handleMappingChange(event) {
      eval(`this.users = this.users.map(record => ${event.target.value})`);
    },
    handleChange(event) {
      this[event.target.name] = event.target.value;
    },
    handleDelete(item) {
      this.extra_headers = this.extra_headers.filter(
        (r) => JSON.stringify(r) != JSON.stringify(item)
      );
    },
    abort() {
      this.socket.emit("abort", {});
      this.is_executing = false;
    },
    execute() {
      this.is_executing = true;
      const socket = io.connect();
      socket.emit("handshake", {
        users: this.users,
        userType: this.user_type,
        auth: {
          key: this.auth_key,
          value: this.auth_value,
        },
        extra_headers: this.extra_headers,
        is_async: this.async_mode,
        endpoint: this.endpoint,
      });

      socket.on("logdata", (data) => {
        this.logs = `${this.logs}\n${data}`;
      });

      socket.on("completed", () => {
        this.is_executing = false;
        this.socket.disconnect();
        this.socket = null;
      });

      this.socket = socket;
    },
  },
  data: () => ({
    csv: {},
    socket: null,
    uploaded: false,
    users: null,
    fieldNames: null,
    current_tab: "Records",
    user_type: "Client",
    auth_key: "",
    auth_value: "",
    endpoint: "",
    header_key: "",
    header_value: "",
    new_header_submitted: false,
    extra_headers: null,
    async_mode: false,
    filter: "",
    mapping: "",
    executeScreen: false,
    logs: "",
    is_executing: false,
  }),
};
</script>
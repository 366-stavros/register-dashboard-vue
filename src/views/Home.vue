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
    <md-steppers style="height:100vh">
      <md-step id="data" md-label="Data">
      <md-field>
      <label>records = records.filter(record => </label>
      <md-input v-model="filter" placeholder="Type your filter here" v-on:change='handleFilterChange' name='filter'></md-input>
    </md-field>
    <md-field>
      <label>records = records.map(record => </label>
      <md-input v-model="mapping" placeholder="Type your mapping here" v-on:change='handleFilterChange' name='mapping'></md-input>
    </md-field>
    <md-button v-if="users_history.length > 0" class="md-raised" v-on:click='undoUsers'>Undo</md-button>
    <div class='inline' style='100vw'>
      <draggable v-model="fieldNames" class="inline" @end="moved">
        <div v-for="fieldName in fieldNames" :key="fieldName">
          <md-card v-if="fieldNames[selected_fieldName] != fieldName" md-with-hover style="margin:0px" @click.native="handleFieldNameClick">
          <md-card-content style="padding:10px"> {{ fieldName }}</md-card-content>
          </md-card>
          <md-field v-else style="width:auto">
          <md-input :value="fieldNames[selected_fieldName]" @keyup.enter="selected_fieldName = ''" @change="handleFieldNameChange" :name="fieldName"></md-input>
          </md-field>    
        </div>
      </draggable>
    </div>
        <div class="table">
              <md-table
                v-model="users"
                md-sort="email"
                md-sort-order="asc"
                :key="main_table"
              >
                <md-table-row slot="md-table-row" slot-scope="{ item }" >
                  <md-table-cell
                    v-for="fieldName in fieldNames"
                    :key="fieldName"
                    :md-label="fieldName"
                    :md-sort-by="fieldName"
                    @click.native="handleTableClick"
                    > 
                    <div v-if="item._selected == fieldName"> 
                      <md-field style="width:auto">
                        <md-input v-model="item[fieldName]" @blur="item._selected = false" @keyup.enter="item._selected = false"></md-input>
                      </md-field>
                    </div> 
                    <div v-else>
                      {{ item[fieldName] }} 
                    </div>
                    </md-table-cell>
                </md-table-row>
              </md-table>
            </div>
      </md-step>
      <md-step id="settings" md-label="Settings">

    <md-card style="width:50vw">
        <md-list>
        <md-subheader>User Type</md-subheader>
        <md-list-item>
          <div class="md-list-item-text inline">
            <md-radio v-for="userType in ['Client','Affiliate']" :key='userType' v-model="user_type" :value='userType'> {{ userType }} </md-radio>
          </div>
        </md-list-item>
        <md-divider/>
        <md-subheader>Asynchronous Mode</md-subheader>
        <md-list-item @click="1">
          <table>
            <tr>
            <div class="md-list-item-text column">
            <md-switch v-model="async_mode" class="md-primary"> {{ async_mode ? 'ON' : 'OFF' }}</md-switch>
            </div>
            </tr>
            <tr v-if="!async_mode">
              <md-field  style="transform:translateY(-20%)">
              <label> in ms </label>
            <md-input v-model="wait_time" placeholder="Add delay (ms)"></md-input>
            </md-field>
              </tr>
          </table>
        </md-list-item>
        <md-divider/>
        
        <md-subheader>Endpoint</md-subheader>
        <md-list-item>
          <md-field>
                      <label>Register Endpoint</label>
                      <md-input v-model="endpoint"></md-input>
                    </md-field>
        </md-list-item>
        <md-divider/>
        <md-subheader>Authentication</md-subheader>
        <md-list-item>
         <div class='inline'>
                    <md-field v-for="[auth_label,auth_key] in [['Key','auth_key'],['Value','auth_value']]" :key='auth_key'>
                      <label>{{ auth_label }}</label>
                      <md-input v-on:change="handleChange" :name="auth_key" :value='getModel(auth_key)'></md-input>
                    </md-field>
                  </div>
        </md-list-item>
        <md-divider/>
        <md-subheader>Extra Headers</md-subheader>
        <md-list-item>
          <div class='inline'>
                    <md-field v-for="[label,key] in [['Key','header_key'],['Value','header_value']]" :key='key'>
                      <label>{{ label }}</label>
                      <md-input v-on:change="handleChange" :name="key" :value='getModel(key)'></md-input>
                    </md-field>
                      <md-button class="md-raised md-primary" style='transform: translateY(30%)' v-on:click='addHeader'>Add</md-button>
                  </div>
        </md-list-item>
        <md-list-item v-if="extra_headers && extra_headers.length > 0">
          <table>
            <tr v-for="header in extra_headers" :key="header.key">
                <div class='inline'>
                    <md-field v-for="[label,value] in [['Key',header.key],['Value',header.value]]" :key='label'>
                      <label>{{ label }}</label>
                      <md-input :value="value" disabled></md-input>
                    </md-field>
                    <md-button class="md-raised md-accent" v-on:click="handleDelete(header)">Delete</md-button>
                </div>
                </tr>
          </table>
        </md-list-item>
        </md-list>
  </md-card>
      </md-step>
      <md-step id='execute' md-label="Execute">
        <md-card style="width:50vw">
        <md-list class="md-triple-line">
          <md-list-item>
            <div class="inline">
             <md-button v-if="!is_executing" class="md-raised md-primary" @click="execute">Execute</md-button>
              <md-button v-if="is_executing" class="md-raised md-primary" @click="abort">Abort</md-button>
              <md-button class="md-primary" @click="results = []">Clear Logs</md-button>
            </div>
          </md-list-item>
          <md-divider v-if="results.length > 0"/>
          <md-list-item v-if="results.length > 0">
             <md-list>
               <md-subheader>Logs</md-subheader>
             <md-list-item >
              <md-table
                v-model="results"
                md-sort="result"
                md-sort-order="asc"
                :key="results_updated"
              >
                <md-table-row slot="md-table-row" slot-scope="{ item }" >
                  <md-table-cell
                    md-label="email"
                    md-sort-by="email"
                    > {{ item.email }}
                  </md-table-cell>
                  <md-table-cell
                    md-label="result"
                    md-sort-by="result"
                    > {{ item.result }}
                  </md-table-cell>
                </md-table-row>
              </md-table>
                    
             </md-list-item>
             </md-list>
          </md-list-item>
        </md-list>
        </md-card>
      </md-step>
    </md-steppers>
    </div>
    <md-snackbar md-position="center" :md-duration="Infinity" :md-active.sync="showSnackbar" md-persistent>
      <span>{{ snackbarText }}</span>
      <md-button class="md-primary" @click="showSnackbar = false">Close</md-button>
    </md-snackbar>
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
.column {
  display: flex;
  flex-direction: column;
}
</style>

<script>
import "vue-material/dist/vue-material.min.css";
import axios from "axios";
import { io } from "socket.io-client";
import draggable from "vuedraggable";

export default {
  name: "Home",
  components: {
    draggable,
  },
  methods: {
    handleUpload(val) {
      this.csv = val.target.files[0];
    },
    async handleClick() {
      const formData = new FormData();
      formData.append("csv", this.csv);
      const reply = await axios.post("/upload", formData);
      this.uploaded = true;
      this.users = reply.data.map((record) => ({
        ...record,
        _selected: false,
      }));
      this.fieldNames = Object.keys(reply.data[0]);
    },
    getModel(val) {
      return this[val];
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
      const new_users = eval(
        `this.users.${
          event.target.name == "filter" ? "filter" : "map"
        }(record => ${event.target.value})`
      );
      if (new_users) {
        this.users_history.push(this.users);
        this.users = new_users;
      }
    },
    handleTableClick(event) {
      const cellIndex =
        this.fieldNames[event.target.parentElement.parentElement.cellIndex];
      const rowIndex =
        event.target.parentElement.parentElement.parentElement.rowIndex;
      if (cellIndex == undefined || rowIndex == undefined) return;
      this.users.forEach((user, index) => {
        if (index != rowIndex - 1 && user._selected) user._selected = "";
      });
      this.users[rowIndex - 1]._selected = cellIndex;
    },
    undoUsers() {
      this.users = this.users_history.pop();
    },
    handleChange(event) {
      this[event.target.name] = event.target.value;
    },
    handleDelete(item) {
      this.extra_headers = this.extra_headers.filter(
        (r) => JSON.stringify(r) != JSON.stringify(item)
      );
      this.extra_headers_updated++;
    },
    handleFieldNameClick(val) {
      this.selected_fieldName = this.fieldNames.lastIndexOf(val.target.innerText)
    },
    handleFieldNameChange(val) {
      this.fieldNames[this.selected_fieldName] = val.target.value
    },
    abort() {
      this.socket.emit("abort", {});
      this.is_executing = false;
    },
    moved() {
      this.main_table++;
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
        wait_time: this.wait_time,
      });

      socket.on("logdata", (data) => {
        this.results_updated++
        this.results.push(data);
      });

      socket.on("completed", () => {
        this.is_executing = false;
        this.socket.disconnect();
        this.socket = null;
      });

      socket.on("error", data => {
        this.showSnackbar = true
        this.snackbarText = data
      })
      this.socket = socket;
    },
  },

  data: () => ({
    csv: {},
    socket: null,
    uploaded: false,
    users: null,
    users_history: [],
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
    wait_time: "",
    main_table: 0,
    extra_headers_updated: 0,
    results: [],
    showSnackbar: false,
    snackbarText: '',
    results_updated: 0,
    selected_fieldName: ''
  }),
  components: {
    tableCell: {
      props: ["value"],
      template: "",
    },
  },
};
</script>
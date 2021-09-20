import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default-dark.css'
import draggable from 'vuedraggable'

Vue.config.productionTip = false
Vue.config.devtools = true

Vue.use(VueMaterial)
Vue.component('draggable',draggable)

Vue.config.errorHandler = (err, vm, info) => {
  if (process.env.NODE_ENV !== 'production') {
    if (err.message !== "Cannot read property 'badInput' of undefined") {
      console.error(err);
    }
  }
};

export const vm = new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
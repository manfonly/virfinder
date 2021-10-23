import Vue from 'vue'
import App from './App.vue'
import BaiduMap from 'vue-baidu-map'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import i18n from './i18n/i18n';

Vue.config.productionTip = false

Vue.use(BaiduMap, {
  ak: '3GcXAuNrnbqBcX3EMBgHcGxH'
})

Vue.use(ElementUI)

new Vue({
  i18n,
  render: h => h(App),
}).$mount('#app')

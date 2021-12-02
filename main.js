import LoadingComponent from "./index.vue";
// 新建一个loading.js文件,引入我们的loading.vue文件

console.log(`==================================`);
console.log(`==================================`);

let $vm;

export default {
  install(Vue, options) {
    if (!$vm) {
      const LoadingPlugin = Vue.extend(LoadingComponent);
      // 通过Vue.extend创建一个构造器LoadingPlugin

      $vm = new LoadingPlugin({
        el: document.createElement("div"),
      });

      // 通过new LoadingPlugin新建一个vm实例 挂载到div元素上
      document.body.appendChild($vm.$el);
      // 通过document.appendChild将其插入到DOM节点中
    }
    // 创建了$vm实例后,我们可以访问该实例的属性和方法比如通过$vm.show就可以改变
    // loading组件的show值来控制其显示隐藏
    $vm.show = false;

    let loading = {
      show(text) {
        $vm.show = true;
        $vm.text = text;
      },
      hide() {
        $vm.show = false;
      },
    };

    if (!Vue.$loading) {
      Vue.$loading = loading;
    }

    // 最后我们通过Vue.mixin或者Vue.prototpye.$loading 来全局添加$loading事件
    // 其又包含了show和hide两个方法，我们可以在页面中使用this.$loading.show()
    // 来显示加载 使用this.$loading.hide()来关闭加载
    Vue.mixin({
      created() {
        this.$loading = Vue.$loading;
      },
    });
  },
};

<script>
import { LoginService } from './services/login'
export default {
  onLaunch: function() {
    console.log("App Launch", new LoginService);
  },
  onShow: function() {
    console.log("App Show", process.env);
  },
  onHide: function() {
    console.log("App Hide");
  },
};
</script>

<style>
/*每个页面公共css */
</style>

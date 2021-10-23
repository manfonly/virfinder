<template>
  <el-container>
    <div width="auto">
      <!-- <button @click="collapseStatus">
        <i class="el-icon-d-arrow-right"></i>
      </button> -->
      <el-radio-group v-model="isCollapse" style="margin-bottom: 20px;">
        <el-radio-button :label="false">{{$t('message.open')}}</el-radio-button>
        <el-radio-button :label="true">{{$t('message.hide')}}</el-radio-button>
      </el-radio-group>
      <el-aside width="auto">
        <el-menu :collapse="isCollapse" mode="vertical">
          <div v-show="!isCollapse">
            <el-form ref="form" label-width="100px">
            <el-form-item :label="$t('message.switchview')">
              <el-button type="primary" @click="switchView">{{view_type}}</el-button>
            </el-form-item>
            <el-form-item :label="$t('message.sensorsize')">
              <el-select v-model="camera_type" placeholder="请选择相机类型">
                <el-option
                  v-for="item in cameras"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('message.aspect')">

            </el-form-item>
            <el-form-item :label="$t('message.fl')">
              <el-slider
                @change="updateFocalLength"
                v-model="focal_length"
                :max="600"
                :min="8">
              </el-slider>
            </el-form-item>
            <el-form-item :label="$t('message.hd')">
              <el-slider
                @change="updateHeading"
                v-model="heading"
                :max="180"
                :min="-180">
              </el-slider>
            </el-form-item>
            <el-form-item :label="$t('message.pc')">
              <el-slider
                @change="updatePitch"
                v-model="pitch"
                :max="90"
                :min="-90">
              </el-slider>
            </el-form-item>
            <el-form-item :label="$t('message.h')">
              <el-slider
                @change="updateHeight"
                v-model="manHeight"
                :max="9000"
                :min="-100">
              </el-slider>
            </el-form-item>
            <el-form-item :label="$t('message.ip')">
              <el-switch
                v-model="show_interest_points"
                active-color="#13ce66"
                inactive-color="#dedede">
              </el-switch>
            </el-form-item>
            <el-form-item :label="$t('message.updatescene')">
              <el-button type="primary" round>{{$t('message.uploadpic')}}</el-button>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="save3DView" icon="el-icon-camera-solid" :disabled="view_type!='3D view'">{{$t('message.savesnapshot')}}</el-button>
          </div>
        </el-menu>
      </el-aside>
    </div>
    <el-main style="padding-top:0px;padding-right:0px;">
      <div>
        <div id="cesiumContainer" v-show="show_3d_map"></div>
        <div class="flexContainer">
          <canvas id="map_canvas" v-show="!show_3d_map"></canvas>
          <baidu-map v-show="!show_3d_map"
            class="map"
            :scroll-wheel-zoom="true"
            :center="location"
            :zoom="zoom"
            @ready="mapReady"
            @click="changeAngle">
              <bm-map-type :map-types="['BMAP_NORMAL_MAP', 'BMAP_HYBRID_MAP']"
                            :offset="{ width: 20, height: 50 }"
                            anchor="BMAP_ANCHOR_BOTTOM_RIGHT"></bm-map-type>
              <bm-scale anchor="BMAP_ANCHOR_TOP_RIGHT"></bm-scale>
              <bm-control :offset="{ width: 20, height: 20 }">
                <bm-auto-complete v-model="keyword" :sugStyle="{ zIndex: 999999 }">
                  <input
                    type="text"
                    placeholder="请输入搜索关键字"
                    class="serachinput"
                  />
                </bm-auto-complete>
              </bm-control>
              <bm-local-search
                :keyword="keyword"
                :auto-viewport="true"
                @searchcomplete="onSearchOK"
                style="width: 0px; height: 0px; overflow: hidden">
              </bm-local-search>
              <bm-navigation type="BMAP_NAVIGATION_CONTROL_SMALL" anchor="BMAP_ANCHOR_TOP_RIGHT"></bm-navigation>
              <bm-marker :position="{lng: marker.lng, lat: marker.lat}"
                :icon="{url: require('@/assets/camera-man.png'), size: {width: 64, height: 64}}"
                :offset="{width: 0, height: -32}"
                :dragging="true" @dragend="get_man_position"></bm-marker>
          </baidu-map>
        </div>
      </div>
    </el-main>
  </el-container>
  
</template>

<script>
import "cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "cesium";

export default {
  name: "Map",
  data() {
    return {
      collapseBtnClick: false,
      isCollapse: false,
      cameras: [{
        value: 'FS',
        label: 'full size sensor'
      }, {
        value: 'CS',
        label: 'cropped sensor'
      }, {
        value: 'M43',
        label: 'M43'
      }],
      camera_type: 'FS',
      focal_length: 50,
      show_interest_points: false,
      show_3d_map: false,
      location: {
        lng: 107.904448,
        lat: 37.265864
      },
      zoom: 5,
      marker: {
        lng: 107.904448,
        lat: 37.265864
      },
      man_icon: null,
      keyword: '',
      proj: null,
      map: null,
      bmap: null,
      view_type: '2D view',
      viewer3D: null,
      coordtransform: null,
      manHeight: -10000,
      terrainProvider: null,
      heading: 0,
      pitch: 0,
      realManLng: 0.0,
      realManLat: 0.0,
      lang: 'en'
    }
  },
  mounted() {
    /* global BMap */
    // let icon_path = require('../assets/camera-man.png');
    // let imageSize = new BMap.Size(64, 64);
    // this.man_icon = new BMap.Icon(icon_path, {width: 32, height: 32}, {
    //   imageSize: imageSize
    // });
    this.switchLang();
    this.init();
  },
  watch: {
    camera_type: function() {
      this.updateFocalLength(this.focal_length);
    }
  },
  methods: {
    switchLang()  {
      this.$i18n.locale = this.lang;
    },
    save3DView() {
      this.viewer3D.render();
      let filename = "untitle.jpg";
      let data = this.viewer3D.canvas.toDataURL();
      let a = document.createElement('a');
      a.href = data;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
    },
    collapseStatus() {
      this.collapseBtnClick = this.isCollapse;
      this.isCollapse = !this.isCollapse;
    },
    collapseOpen() {
      if (this.collapseBtnClick) {
        return;
      }
      this.isCollapse = false;
    },
    collapseClose() {
      if (this.collapseBtnClick) {
        return;
      }
      this.isCollapse = true;
    },
    mapReady({ BMap, map }) {
      this.map = map;
      this.bmap = BMap;
      this.proj = map.getMapType().getProjection();
    },
    init() {
      this.coordtransform = require('coordtransform');
      Cesium.Ion.defaultAccessToken = 'Your cesium API key';
      this.terrainProvider = Cesium.createWorldTerrain();
      let viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: this.terrainProvider
      });
      this.d3viewer = viewer;
      viewer.animation.container.style.visibility = 'hidden';
      viewer.timeline.container.style.visibility = 'hidden';
      viewer.forceResize();
      const buildingTileset = viewer.scene.primitives.add(Cesium.createOsmBuildings())
      console.log(buildingTileset)

      // let imageryLayers = viewer.imageryLayers;

      // let googleMap = new Cesium.UrlTemplateImageryProvider({
      //   url: "http://www.google.com/maps/vt?lyrs=s@716&x={x}&y={y}&z={z}"
      // });

      // imageryLayers.addImageryProvider(googleMap);
      viewer.camera.frustum.fov = this.focalLengthToFOV(50);
      // fly
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          114.296063,
          30.55245,
          20000000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        },
        duration: 10 // fly time 10s
      });
      this.viewer3D = viewer;
    },
    onSearchOK() {
      console.log("Search completed!");
      this.$nextTick(()=>{
        // let allOverlays = this.map.getOverlays();
        // this.map.removeOverlay(allOverlays[allOverlays.length - 1]);
        this.marker = this.map.getCenter();
        console.log(this.marker);
      });
    },
    calcFov (x, f) {
      return 2.0 * Math.atan(x / 2.0 / f);
    },
    focalLengthToFOV (fl) {
      let sensorSize = Math.sqrt(36 * 36 + 24 * 24);
      if (this.camera_type == "CS") {
        sensorSize /= 1.6;
      } else if (this.camera_type == "M43") {
        sensorSize /= 1.85;
      }
      let rad = this.calcFov(sensorSize, fl);
      console.log("Computed radian:", rad);
      return rad;
    },
    get_man_position(e) {
      //console.log(e.point);
      this.marker = e.point;
      let pixel = this.map.pointToPixel(e.point);
      console.log(pixel);
    },
    changeAngle(e) {
      //let dpi = window.devicePixelRatio;
      console.log(e.point);
      let markerPos = new BMap.Point(this.marker.lng, this.marker.lat);
      console.log(markerPos);
      let startPoint = this.map.pointToPixel(markerPos);
      console.log(startPoint);
      let endPoint = this.map.pointToPixel(e.point);
      console.log(endPoint);
      let canvas = document.getElementById('map_canvas');
      let width = getComputedStyle(canvas).getPropertyValue('width').slice(0,-2);
      let height = getComputedStyle(canvas).getPropertyValue('height').slice(0,-2);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      let ctx = canvas.getContext('2d');

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'green';

      ctx.beginPath();
      ctx.lineTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
      console.log(this.computeHAngle(startPoint, endPoint));
    },
    computeHAngle(startP, endP) {
      let dy = endP.y - startP.y;
      let dx = endP.x - startP.x;
      let theta = Math.atan2(dy, dx);
      theta *= 180/Math.PI;
      // angle from north
      theta += 90;
      if (theta > 180) {
        theta -= 360;
      }
      this.heading = theta;
      return theta;
    },
    switchView() {
      if (this.show_3d_map) {
        this.view_type = "2D view";
      } else {
        this.view_type = "3D view";
      }
      this.show_3d_map = !this.show_3d_map;
      let bd09togcj02 = this.coordtransform.bd09togcj02(this.marker.lng, this.marker.lat);
      let gcj02towgs84 = this.coordtransform.gcj02towgs84(bd09togcj02[0], bd09togcj02[1]);
      this.manHeight = -10000;
      this.realManLng = gcj02towgs84[0];
      this.realManLat = gcj02towgs84[1];
      this.doSwitchView(gcj02towgs84[0], gcj02towgs84[1]);
    },
    updateFocalLength(v) {
      console.log(v);
      this.viewer3D.camera.frustum.fov = this.focalLengthToFOV(v);
    },
    updateHeading(v) {
      this.updateCamera(v);
    },
    updatePitch(v) {
      this.updateCamera(v);
    },
    updateHeight(v) {
      this.updateCamera(v);
    },
    updateCamera(v) {
      console.log(v);
      let vm = this;
      //this.viewer3D.camera.up = Cesium.Math.toRadians(this.pitch);
      this.viewer3D.camera.setView({
        destination : Cesium.Cartesian3.fromDegrees(
          vm.realManLng,
          vm.realManLat,
          vm.manHeight),
        orientation: {
            heading: Cesium.Math.toRadians(vm.heading),
            pitch: Cesium.Math.toRadians(vm.pitch),
            roll: 0.0
        }
      });
    },
    doSwitchView(lng, lat) {
      let positions = [
        Cesium.Cartographic.fromDegrees(lng, lat),
      ];
      var promise = Cesium.sampleTerrain(this.terrainProvider, 11, positions);
      let vm = this;
      Cesium.when(promise, function(updatedPositions) {
        // positions[0].height and positions[1].height have been updated.
        // updatedPositions is just a reference to positions.
        console.log(updatedPositions);
        vm.manHeight = positions[0].height + 3;
        console.log(vm.manHeight);

        vm.viewer3D.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            vm.realManLng,
            vm.realManLat,
            vm.manHeight
          ),
          orientation: {
            heading: Cesium.Math.toRadians(vm.heading),
            pitch: Cesium.Math.toRadians(vm.pitch),
            roll: 0.0
          },
          duration: 1 // fly time 1s
        });
      });
    }
  }
};
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.map {
  width: 100%;
  height: 100vh;
}
body > .el-container {
  margin-bottom: 40px;
}
canvas {
  position: absolute;
  width: 100%;
  height: 100vh;
  z-index: 500;
  left: 0px;
  top: 0px;
  pointer-events:none;
}
.flexContainer{
  display:flex;
  flex-wrap:wrap;
  text-align:center;
  position:relative;
}
</style>

"use client";

import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";

const EarthModel = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadGeoJSON = async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    };
    // 创建国家边界对象
    const createCountryBorders = (geoJSONData) => {
      const canvas = canvasRef.current;
      const engine = new BABYLON.Engine(canvas, true);
      const scene = new BABYLON.Scene(engine);

      // 创建一个相机
      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 4,
        10,
        new BABYLON.Vector3(0, 0, 0)
      );
      camera.attachControl(canvas, true);
      camera.wheelPrecision = 20; // 降低缩放速度
      camera.minZ = 0.1; // 设置相机的最小深度范围
      camera.maxZ = 100; // 设置相机的最大深度范围

      // 创建一个光源
      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.5; // 增加光源的强度
      light.diffuse = new BABYLON.Color3(1, 1, 1); // 设置光源的漫射颜色

      // 创建地球模型
      const earthMaterial = new BABYLON.StandardMaterial(
        "earthMaterial",
        scene
      );

      earthMaterial.diffuseTexture = new BABYLON.Texture(
        "/textures/earth.jpg",
        scene
      );
      const earth = BABYLON.MeshBuilder.CreateSphere(
        "earth",
        { diameter: 2 },
        scene
      );

      earth.material = earthMaterial;
      earth.rotation.x = Math.PI;

      earthMaterial.ambientColor = new BABYLON.Color3(1, 1, 1); // 增加材质的环境反射
      earthMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // 增加材质的自发光

      const radius = earth.getBoundingInfo().boundingSphere.radius / 2;
      // 调整 canvas 元素样式使其全屏
      engine.getRenderingCanvas().style.width = "100%";
      engine.getRenderingCanvas().style.height = "100%";
      // 遍历 GeoJSON 数据中的 features
      geoJSONData.features.forEach((feature) => {
        const coordinates = feature.geometry.coordinates;

        let points = [];
        coordinates.forEach((coords) => {
          points = [];
          coords.forEach((coord) => {
            if (Array.isArray(coord[0])) {
              points = [];
              coord.forEach((co) => {
                points.push(latLongToVector3(co[1], co[0], radius));
              });
              createCountryBorder(feature,points,scene)
              points = []
            } else {
              points.push(latLongToVector3(coord[1], coord[0], radius));
            }
          });
          createCountryBorder(feature,points,scene)
        });
      });

      engine.runRenderLoop(() => {
        scene.render();
      });
      return () => {
        scene.dispose();
        engine.dispose();
      };
    };
    function createCountryBorder(feature, points, scene) {
      // 创建边界路径
      const borderMesh = BABYLON.MeshBuilder.CreateLines(
        "border",
        { points: points },
        scene
      );
      borderMesh.color = new BABYLON.Color3(1, 1, 1);
      // 添加点击事件
      borderMesh.actionManager = new BABYLON.ActionManager(scene);
      borderMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            console.log(`Selected country: ${feature.properties.name}`);
            // 在这里处理选中国家的逻辑，例如显示信息、改变颜色等
          }
        )
      );
    }
    function latLongToVector3(lat, lon, radius) {
      const phi = ((90 - lat) * Math.PI) / 180; // 纬度转换为弧度
      const theta = ((lon + 180) * Math.PI) / 180; // 经度转换为弧度

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return new BABYLON.Vector3(x, y, z).scale(1.16);
    }

    const disposeFunc = loadGeoJSON("countries.geo.json")
      .then((data) => createCountryBorders(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));

    return () => {
      disposeFunc.then((func) => func());
    };
  }, []);
  return <canvas ref={canvasRef} class="w-screen h-screen" />;
};

export default EarthModel;

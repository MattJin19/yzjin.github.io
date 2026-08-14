(function () {
  // ==================== 1. 在这里配置你的经历数据 ====================
  const EXPERIENCES = [
  {
    date: "09/2021 - Present",
    title: "Postgraduate Researcher",
    org: "Oxford e-Research Centre, University of Oxford",
    loc: "Oxford, England, UK",
    note: "Developing visualization and quality assurance tools for model testing using Python, PyQt5, and visual analytics methods",
    coords: [-1.2554, 51.7520]
  },
  {
    date: "11/2023 - 06/2024",
    title: "Visiting Researcher",
    org: "Inetum",
    loc: "Madrid, Spain",
    note: "Implemented visual design and generative AI approaches for supporting text classification models at FabLab",
    coords: [-3.7038, 40.4168]
  },
  {
    date: "05/2023 - 07/2023",
    title: "Visiting Intern",
    org: "Inria / Université Paris-Saclay",
    loc: "Paris, France",
    note: "Designed visualization tools for dynamic time series analysis and model training support at Ex)situ Team",
    coords: [2.2088, 48.7148]
  },
  {
    date: "08/2022 - 11/2022",
    title: "Visiting Researcher",
    org: "Statistics Netherlands (CBS)",
    loc: "Heerlen, Netherlands",
    note: "Designed ML model quality assurance tools for wearable-device time series classification tasks",
    coords: [5.9797, 50.8882]
  },
  {
    date: "09/2020 - 08/2021",
    title: "Graduate Research Assistant",
    org: "Design Automation of Intelligent Systems Lab, Northwestern University",
    loc: "Evanston, IL, USA",
    note: "Applied machine learning methods for connected and automated vehicle behavior prediction",
    coords: [-87.6753, 42.0565]
  },
  {
    date: "06/2020 - 09/2020",
    title: "Visiting Research Assistant",
    org: "Information Sciences Institute, University of Southern California",
    loc: "Los Angeles, CA, USA",
    note: "Extended CIFT software on FPGA platform with device coverage tracking and reporting support",
    coords: [-118.4514, 33.9803]
  }
];
  // ====================================================================

  const state = { active: 0, hovering: false };

  const rootEl = document.getElementById("globe-timeline-root");
  const connectorSvg = d3.select("#gt-connector");
  const connectorLine = connectorSvg.append("path").attr("class", "gt-connector-line");

  const svg = d3.select("#gt-globe");
  const width = 500, height = 500;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3.geoOrthographic()
    .scale(220)
    .translate([width / 2, height / 2])
    .clipAngle(90)
    .rotate([-16, -25, 0]); // 初始朝向欧洲附近

  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  svg.append("circle")
    .attr("class", "gt-sphere")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale());

  svg.append("path")
    .datum(graticule())
    .attr("class", "gt-graticule")
    .attr("d", path);

  const landGroup = svg.append("g");
  const pointsGroup = svg.append("g");
  const labelGroup = svg.append("g");

  // 世界陆地轮廓（简化版 world-atlas，CDN 加载）
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json").then(function (world) {
    const land = topojson.feature(world, world.objects.land);
    landGroup.selectAll("path")
      .data([land])
      .join("path")
      .attr("class", "gt-land")
      .attr("d", path);
    render();
  }).catch(function () {
    // 若 CDN 加载失败，仍渲染纯经纬网 + 点
    render();
  });

  function render() {
    landGroup.selectAll("path").attr("d", path);

    pointsGroup.selectAll("circle")
      .data(EXPERIENCES)
      .join("circle")
      .attr("class", (d, i) => "gt-point" + (i === state.active ? " active" : ""))
      .attr("r", (d, i) => (i === state.active ? 6 : 3))
      .attr("transform", d => {
        const p = projection(d.coords);
        return p ? `translate(${p[0]},${p[1]})` : "translate(-100,-100)";
      })
      .style("display", d => {
        const visible = isVisible(d.coords);
        return visible ? "block" : "none";
      });

    labelGroup.selectAll("text")
      .data([EXPERIENCES[state.active]])
      .join("text")
      .attr("class", "gt-label")
      .attr("transform", d => {
        const p = projection(d.coords);
        return p ? `translate(${p[0] + 9},${p[1] - 9})` : "translate(-100,-100)";
      })
      .text(d => d.loc.split(",")[0])
      .style("display", d => isVisible(d.coords) ? "block" : "none");

    updateConnector();
  }

  function isVisible(coords) {
    const rotate = projection.rotate();
    const center = [-rotate[0], -rotate[1]];
    const dist = d3.geoDistance(coords, center);
    return dist < Math.PI / 2;
  }

  // ==================== 连接线：从经历卡片右边缘 到 地球上高亮点 ====================
  function updateConnector() {
    if (!state.hovering) {
      connectorLine.classed("visible", false);
      return;
    }

    const d = EXPERIENCES[state.active];
    if (!isVisible(d.coords)) {
      connectorLine.classed("visible", false);
      return;
    }

    const rootRect = rootEl.getBoundingClientRect();

    // 起点：当前激活的经历条目，右边缘中点
    const activeItemEl = document.querySelector('.gt-item[data-index="' + state.active + '"]');
    if (!activeItemEl) return;
    const itemRect = activeItemEl.getBoundingClientRect();
    const startX = itemRect.right - rootRect.left;
    const startY = itemRect.top + itemRect.height / 2 - rootRect.top;

    // 终点：地球上高亮点的位置（需要把 svg 坐标转换为页面坐标）
    const svgEl = document.getElementById("gt-globe");
    const svgRect = svgEl.getBoundingClientRect();
    const p = projection(d.coords);
    if (!p) return;

    // viewBox 是 0 0 500 500，需要按实际渲染尺寸缩放
    const scaleX = svgRect.width / width;
    const scaleY = svgRect.height / height;
    const endX = svgRect.left + p[0] * scaleX - rootRect.left;
    const endY = svgRect.top + p[1] * scaleY - rootRect.top;

    // 用平滑曲线连接（贝塞尔曲线，类似示例图中的弧线效果）
    const midX = (startX + endX) / 2;
    const dPath = `M ${startX},${startY} C ${midX},${startY} ${midX},${endY} ${endX},${endY}`;

    connectorLine
      .attr("d", dPath)
      .classed("visible", true);
  }

  function rotateTo(coords, done) {
    const targetRotate = [-coords[0], -coords[1], 0];
    const currentRotate = projection.rotate();

    d3.transition()
      .duration(900)
      .ease(d3.easeCubicInOut)
      .tween("rotate", function () {
        const r = d3.interpolate(currentRotate, targetRotate);
        return function (t) {
          projection.rotate(r(t));
          render();
        };
      })
      .on("end", function () {
        if (done) done();
      });
  }

  // ==================== 渲染左侧时间线 ====================
  const timelineDiv = d3.select("#gt-timeline");
  const items = timelineDiv.selectAll(".gt-item")
    .data(EXPERIENCES)
    .join("div")
    .attr("class", (d, i) => "gt-item" + (i === state.active ? " active" : ""))
    .attr("data-index", (d, i) => i)
    .on("mouseenter", function (event, d) {
      const i = EXPERIENCES.indexOf(d);
      state.active = i;
      state.hovering = true;
      items.attr("class", (dd, ii) => "gt-item" + (ii === i ? " active" : ""));
      rotateTo(d.coords, updateConnector);
      updateConnector();
    })
    .on("mouseleave", function () {
      state.hovering = false;
      updateConnector();
    });

  items.append("div").attr("class", "gt-date").text(d => d.date);
  items.append("div").attr("class", "gt-divider");
  const body = items.append("div").attr("class", "gt-body");
  body.append("p").attr("class", "gt-title").text(d => d.title);
  body.append("p").attr("class", "gt-org").text(d => d.org);
  body.append("p").attr("class", "gt-loc").text(d => "📍 " + d.loc);
  body.filter(d => d.note).append("p").attr("class", "gt-note").text(d => d.note);

  // 窗口尺寸变化 / 滚动时，重新计算连接线位置
  window.addEventListener("resize", updateConnector);
  window.addEventListener("scroll", updateConnector, true);

})();

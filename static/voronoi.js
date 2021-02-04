//begin: constants
var _2PI = 2 * Math.PI;
//end: constants

//begin: layout conf.
var svgWidth = 500,
  svgHeight = 600,
  margin = { top: 50, right: 50, bottom: 50, left: 50 },
  height = svgHeight - margin.top - margin.bottom,
  width = svgWidth - margin.left - margin.right,
  halfWidth = width / 2,
  halfHeight = height / 2,
  quarterWidth = width / 4,
  quarterHeight = height / 4,
  titleY = 20,
  legendsMinY = height + 50,
  treemapRadius = 205,
  treemapCenter = [halfWidth, halfHeight + 5];
//end: layout conf.

//begin: treemap conf.
var _voronoiTreemap = d3.voronoiTreemap();
var hierarchy, circlingPolygon;
//end: treemap conf.

//begin: drawing conf.
var fontScale = d3.scaleLinear();
//end: drawing conf.

//begin: reusable d3Selection
var svg, drawingArea, treemapContainer;
//end: reusable d3Selection

d3.json("data/mostpresent.json", function (error, rootData) {
  if (error) throw error;

  initData();
  initLayout(rootData);

  hierarchy = d3.hierarchy(rootData).sum(function (d) { return d.weight; });
  _voronoiTreemap
    .clip(circlingPolygon)
    (hierarchy);

  drawTreemap(hierarchy);
});

function initData(rootData) {
  circlingPolygon = computeCirclingPolygon(treemapRadius);
  fontScale.domain([4, 60]).range([8, 15]).clamp(true);
}

function computeCirclingPolygon(radius) {
  var points = 60,
    increment = _2PI / points,
    circlingPolygon = [];

  for (var a = 0, i = 0; i < points; i++, a += increment) {
    circlingPolygon.push(
      [radius + radius * Math.cos(a), radius + radius * Math.sin(a)]
    )
  }

  return circlingPolygon;
};

function initLayout(rootData) {
  svg = d3.select("#treemap")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  drawingArea = svg.append("g")
    .classed("drawingArea", true)
    .attr("transform", "translate(" + [margin.left, margin.top] + ")");

  treemapContainer = drawingArea.append("g")
    .classed("treemap-container", true)
    .attr("transform", "translate(" + treemapCenter + ")");

  treemapContainer.append("path")
    .classed("world", true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .attr("d", "M" + circlingPolygon.join(",") + "Z");

}

function drawLegends(rootData) {
  var legendHeight = 13,
    interLegend = 4,
    colorWidth = legendHeight * 6,
    continents = rootData.children.reverse();

  var legendContainer = drawingArea.append("g")
    .classed("legend", true)
    .attr("transform", "translate(" + [0, legendsMinY] + ")");

  var legends = legendContainer.selectAll(".legend")
    .data(continents)
    .enter();

  var legend = legends.append("g")
    .classed("legend", true)
    .attr("transform", function (d, i) {
      return "translate(" + [0, -i * (legendHeight + interLegend)] + ")";
    })

  legend.append("rect")
    .classed("legend-color", true)
    .attr("y", -legendHeight)
    .attr("width", colorWidth)
    .attr("height", legendHeight)
    .style("fill", function (d) { return d.color; });
  legend.append("text")
    .classed("tiny", true)
    .attr("transform", "translate(" + [colorWidth + 5, -2] + ")")
    .text(function (d) { return d.name; });
}


function drawTreemap(hierarchy) {

 
 const div_tooltip = d3.select("#treemap").append("div")
 .attr("class", "tooltip")
 .style("opacity", 0);


  var leaves = hierarchy.leaves();

  var cells = treemapContainer.append("g")
    .classed('cells', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".cell")
    .data(leaves)
    .enter()
    .append("path")
    .classed("cell", true)
    .attr("d", function (d) { return "M" + d.polygon.join(",") + "z"; })
    .style("fill", function (d) {
      return d.parent.data.color;
    });

  var labels = treemapContainer.append("g")
    .classed('labels', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".label")
    .data(leaves)
    .enter()
    .append("g")
    .classed("label", true)
    .attr("transform", function (d) {
      return "translate(" + [d.polygon.site.x, d.polygon.site.y] + ")";
    })
    .style("font-size", function (d) {
      return fontScale(d.data.weight)+"px";
    })
    .style("opacity", d => d.data.weight > 2 ? 1 : 0);

  labels.append("text")
    .classed("name", true)
    .html(function (d) {
      return (d.data.weight < 13) ? d.data.code : d.data.name;
    });
  labels.append("text")
    .classed("value", true)
    .text(d => d.data.weight > 4 ? d.data.weight + "%" : null);

  var hoverers = treemapContainer.append("g")
    .classed('hoverers', true)
    .attr("transform", "translate(" + [-treemapRadius, -treemapRadius] + ")")
    .selectAll(".hoverer")
    .data(leaves)
    .enter()
    .append("path")
    .classed("hoverer", true)
    .attr("d", function (d) { return "M" + d.polygon.join(",") + "z"; });

  hoverers.append("title")
    .text(function (d) { return d.data.name + "\n" + d.value + "%"; });
    

  hoverers.on("mouseover", function (d) {
    div_tooltip.transition()
          .duration(200)
          .style("opacity", .9);
    div_tooltip.html(function(){
      var label = d.data.name + " is present on "+ d.data.weight +"% of the analyzed websites. <br><br> It has store and read the following cookies : "+d.data.cookie+".";
      
      if (d.data.ads == 1)
        label += "<br><br> Its privacy policy indicates that these cookies are used for advertising purposes.";
      else if (d.data.ads == 0)
        label += "<br><br> Its privacy policy has not been analyzed.";
      else if (d.data.ads == -1)
        label += "<br><br> Its privacy policy doesn't indicate advertising purposes.";

      if (d.data.privacy)
        label += "<br><br> Click on this area to view its privacy policy.";

      return label;
    })
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 50) + "px");
  })
  .on("mouseout", function (d) {
    div_tooltip.transition()
          .duration(500)
          .style("opacity", 0);
  })
  .on("click", function (d) {
    if (d.data.privacy)
      window.open(d.data.privacy, "_blank"); 
  });

}
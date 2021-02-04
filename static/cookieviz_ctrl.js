const loaded_plugins = {};
var stop_interval = null;

var width = 960;
var height = 500;


function load_graph(nodes, links, zoom, force) {
    let simulation;
    const scale = d3.scaleOrdinal(d3.schemeCategory10);

    function releasenode(d) {
        d.fx = null;
        d.fy = null;
    }

    function isConnected(a, b) {
        return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
    }

    function releasenode(d) {
        d.fx = null;
        d.fy = null;
    }

    function fade(opacity) {
        return d => {
            node.style('stroke-opacity', function (o) {
                const thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('opacity', thisOpacity);
                return thisOpacity;
            });
    
            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
    
        };
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      }
      
      function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

    function zoom_actions() {
        g.attr("transform", d3.event.transform)
    }

    var transform = d3.zoomIdentity.scale(zoom);

    //add zoom capabilities 
    var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    d3.select("#cookieviz").selectAll("*").remove();
    
    var svg = d3.select("#cookieviz")
    .append("svg")
    .attr("width", "100%")
    .attr("viewBox", [-width / 2, -height / 2, width, height]); // Calls/inits handleZoom;

    zoom_handler(svg); 

    var tooltip = d3.select("#cookieviz")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(force))
        .force("x", d3.forceX())
        .force("y", d3.forceY());


    var g = svg.append("g")
        .attr("class", "everything")
        .attr("transform", transform); ;
    

    svg.call(zoom_handler)                       // Adds zoom functionality
    .call(zoom_handler.transform, transform);

    var link = g.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", d => d.cookie ? 2 : 1)
        .attr("stroke", d => d.cookie ? 'red' : '#999')
        .attr('class', 'link')
        .on('mouseover.tooltip', function (d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html(d.cookie ? 
                "Le site " + d.target.id +" depose " + d.cookie + " cookies sur le site "+ d.source.id : 
                "Le site " + d.target.id +" ne depose pas de cookies sur le site "+ d.source.id)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on("mouseout.tooltip", function () {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on('mouseout.fade', fade(1))
        .on("mousemove", function () {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        });

    var node = g.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("g")
        .data(nodes)
        .enter().append("g").call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on('mouseover.tooltip', function (d) {
            tooltip.transition()
                .duration(300)
                .style("opacity", .8);
            tooltip.html(d.id)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('mouseover.fade', fade(0.1))
        .on("mouseout.tooltip", function () {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        })
        .on('mouseout.fade', fade(1))
        .on("mousemove", function () {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 10) + "px");
        })
        .on('dblclick', releasenode);

    node.append("circle")
        .attr("r", 12)
        .attr("fill", (d) => { 
            return d.visited == 1 ? "#1f77b4" : "#ff7f0e";
        });


    node.append("image")
        .attr("xlink:href", (d) => { return d.icon ? d.icon : "./static/empty_favicon.png"; })
        .attr("x", "-8")
        .attr("y", "-8")
        .attr("width", "16")
        .attr("height", "16");

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
    });

    const linkedByIndex = {};
    links.forEach(d => {
        linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
    });
}


function loadGlobal(){
    d3.json("data/global.json", function (error, data) {
        load_graph(data.nodes, data.links, 0.05, -5000);
        const d1 = document.getElementById('visited_choice');
        const d2 = document.getElementById('third_choice');

        data.nodes
        .filter(x => x.visited == 1)
        .map(x => [x.id])
        .sort()
        .forEach(x => d1.insertAdjacentHTML('beforeend', '<option value="data/' + x + '.json">' + x + '</option>'));
        
        data.nodes
        .filter(x => x.visited == 0)
        .map(x => [x.id])
        .sort()
        .forEach(x => d2.insertAdjacentHTML('beforeend', '<option value="data/' + x + '.json">' + x + '</option>'));


        d1.selectedIndex = 0;
        d2.selectedIndex = 0;
        
        d1.addEventListener('change', (event) => 
            d3.json(event.target.value, function (error, data) {
                load_graph(data.nodes, data.links, 1,-200);
            })
        );
        d2.addEventListener('change', (event) => 
            d3.json(event.target.value, function (error, data) {
                load_graph(data.nodes, data.links,1,-200);
            })
        );

    })
}

loadGlobal();

function openVisited() {
    const d1 = document.getElementById('visited_choice');

    var randIdx = Math.random() * d1.options.length;
    randIdx = parseInt(randIdx, 10);
    d1.selectedIndex =randIdx;
    d1.dispatchEvent(new Event('change'));
};

function openThird() {
    const d2 = document.getElementById('third_choice');

    var randIdx = Math.random() * d2.options.length;
    randIdx = parseInt(randIdx, 10);
    d2.selectedIndex =randIdx;
    d2.dispatchEvent(new Event('change'));
};
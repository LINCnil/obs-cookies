const width_hist = 600;
const heigth_hist = 600;

d3.json("data/distribution.json", function (error, data) {

    ordinals = data.map(x => x.site);

    let margin = {
        top: 20, right: 40, bottom: 100, left: 40
    },
        width = width_hist - margin.left - margin.right,
        height = heigth_hist - margin.top - margin.bottom,
        radius = (Math.min(width, height) / 2) - 10,
        node


    const svg_hist = d3.select("#hist").append("svg")
        .attr('width', width_hist)
        .attr('height', heigth_hist)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        .call(
            d3.zoom()
                .translateExtent([[0, 0], [width, height]])
                .extent([[0, 0], [width, height]])
                .on('zoom', zoom)
        )

    const div = d3.select("#hist").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);


    // the scale
    let x = d3.scaleLinear().range([0, width])
    let y = d3.scaleLinear().range([height, 0])
    let color = d3.scaleOrdinal(d3.schemeCategory10)
    let xScale = x.domain([-1, ordinals.length])
    let yScale = y.domain([0, d3.max(data, function (d) { return d.value })])
    // for the width of rect
    let xBand = d3.scaleBand().domain(d3.range(-1, ordinals.length)).range([0, width])
    
    const range_min = 7;
    const range_max = 1;

    // zoomable rect
    svg_hist.append('rect')
        .attr('class', 'zoom-panel')
        .attr('width', width)
        .attr('height', height)

    // x axis
    let xAxis = svg_hist.append('g')
        .attr('class', 'xAxis')
        .attr('transform', `translate(0, ${height})`)
        .call(
            d3.axisBottom(xScale).tickFormat((d, e) => {
                return ordinals[d]
            })
        );

    xAxis.selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    // y axis
    let yAxis = svg_hist.append('g')
        .attr('class', 'y axis')
        .call(d3.axisLeft(yScale))

    let bars = svg_hist.append('g')
        .attr('clip-path', 'url(#my-clip-path)')
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', function (d, i) {
            return xScale(i) - xBand.bandwidth() * 0.9 / 2
        })
        .attr('y', function (d, i) {
            return yScale(d.value)
        })
        .attr('width', xBand.bandwidth() * 0.9)
        .attr('height', function (d) {
            return height - yScale(d.value)
        })
        .style("fill", d => d.value >= range_min ? "#fb8761" : d.value < range_max ? "#4f127b" : "#b5367a")
        .on("mouseover", function (d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.value + " sites tiers lisent des cookies depuis "+ d.site )
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
        })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });

    let defs = svg_hist.append('defs')

    // use clipPath
    defs.append('clipPath')
        .attr('id', 'my-clip-path')
        .append('rect')
        .attr('width', width)
        .attr('height', height)

    let hideTicksWithoutLabel = function () {
        d3.selectAll('.xAxis .tick text').each(function (d) {
            if (this.innerHTML === '') {
                this.parentNode.style.display = 'none'
            }
        })
    }

    function zoom() {
        if (d3.event.transform.k < 1) {
            d3.event.transform.k = 1
            return
        }

        xAxis.call(
            d3.axisBottom(d3.event.transform.rescaleX(xScale)).tickFormat((d, e, target) => {
                // has bug when the scale is too big
                if (Math.floor(d) === d3.format(".1f")(d)) return ordinals[Math.floor(d)]
                return ordinals[d]
            })
        )

        hideTicksWithoutLabel()

        xAxis.selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

        // the bars transform
        bars.attr("transform", "translate(" + d3.event.transform.x + ",0)scale(" + d3.event.transform.k + ",1)")

    }
});
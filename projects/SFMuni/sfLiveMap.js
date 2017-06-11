(function () {
    'use strict';

    // only load routes once
    var routesJson = [];
    var routeColors = {};

    /** Setup for map */
    var q = d3.queue();

    var width = Math.max(960, document.getElementById('sfMap').offsetWidth - 30),
        height = Math.max(500, window.innerHeight - 80);

    var projection = d3.geo.mercator()
        .center([-122.42, 37.77])
        .scale((1300000) / 2 / Math.PI)
        .translate([width / 2, height / 2]);

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on('zoom', move);

    var path = d3.geo.path()
        .projection(projection);

    var svg = d3.select('#sfMap').append('svg')
        .attr('id', 'mySvg')
        .attr('width', width)
        .attr('height', height)
        .call(zoom)
        .append('g');

    var g = svg.append('g');    

    svg.append('rect')
        .attr('class', 'overlay')
        .attr('x', -width)
        .attr('y', -height)
        .attr('width', width)
        .attr('height', height);

    d3.queue()
        .defer(renderNeighborhoods)
        .defer(renderStreets)
        .defer(loadRoutes)        
        .awaitAll(function (error, results) {
            if (error) throw error;
        });
    /** End map setup */    
    
    // re-draw vehicles and routes according every refreshTime seconds
    var refreshTime = 15000;    
    var inter = setInterval(function () {
        var routeTags = getSelectedRoutes();
        drawVehicles(routeTags);
        drawRoutes(routeTags);
    }, refreshTime);

    /** TODO: Attempt a more responsive map */
    // var chart = $('#mySvg');
    // $(window).on('resize', function() {
    //     chart.attr('width', Math.max(960, document.getElementById('sfMap').offsetWidth-30));
    //     chart.attr('height', Math.max(500, window.innerHeight - 80));
    // }).trigger('resize');    


    // initially draw all vehicals
    drawVehicles();

    /** Populate the route tag dropdown */
    $.getJSON('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni&t=0', function (json) {
        var tempColors = randomColor({ count: json.route.length });
        for (var index in json.route) {
            $('.selectpicker').append('<option value=\"' + json.route[index].tag + '\">' + json.route[index].title + '</option>');
            $('.selectpicker').selectpicker('refresh');
            routeColors[json.route[index].tag] = tempColors[index];
        }
    });

    /** Route dropdown on change*/
    $('.selectpicker').change(function () {
        var routeTags = getSelectedRoutes();
        drawVehicles(routeTags);
        drawRoutes(routeTags);
    });

    /** Vehicles */
    var vehicleTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function (d) { return 'Route: ' + d.routeTag + ', Speed: ' + d.speedKmHr + ' km/hr <br/> (last update: ' + d.secsSinceReport + 's ago)' })
    
    svg.call(vehicleTip);

    function drawVehicles(routeTags) {
        g.selectAll('circle').remove();
        d3.json('http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0', function (error, json) {
            if (error) throw error;
            var vehicles = [];
            if (routeTags && routeTags.length > 0) {
                for (var i = 0; i < json.vehicle.length; i++) {
                    if ($.inArray(json.vehicle[i].routeTag, routeTags) > -1) {
                        vehicles.push(json.vehicle[i]);
                    }
                }
            } else {
                vehicles = json.vehicle;
            }
            g.selectAll('.vehicle')
                .data(vehicles)
                .enter().append('circle', '.vehicle')
                .attr('r', 4)
                .style('fill', function (d) { return routeColors[d.routeTag]; })
                .attr('class', function (d) { return 'vehicle ' + 'routetag_' + d.routeTag; })
                .attr('transform', function (d) {
                    return 'translate(' + projection([
                        d.lon,
                        d.lat
                    ]) + ')';
                })
                .on('mouseover', vehicleTip.show)
                .on('mouseout', vehicleTip.hide)
        });
    }
    /* End Vehicles */

    /** Routes 
     * Only display selected routes.
    */
    function drawRoutes(routeTags) {
        g.selectAll('line').remove();
        if (routeTags.length === 0) {
            return;
        }
        var routes = routesJson;
        var routePaths = {};
        routes.forEach(function (route, index) {
            if ($.inArray(route.tag, routeTags) > -1) {
                routePaths[route.tag] = [];
                route.path.forEach(function (path, index) {
                    for (var i = 0; i < path.point.length - 1; i++) {
                        routePaths[route.tag]
                            .push(
                            [
                                projection([path.point[i].lon, path.point[i].lat]),
                                projection([path.point[i + 1].lon, path.point[i + 1].lat])
                            ]
                            )
                    }
                })
            }
        });
        for (var routeId in routePaths) {
            g.selectAll('.route_' + routeId)
                .data(routePaths[routeId])
                .enter().append('line', '.route')
                .attr('class', 'route ' + 'routetag_' + routeId)
                .style('stroke', routeColors[routeId])
                .attr('stroke-width', 2)
                .attr('x1', function (d) {
                    return d[0][0];
                })
                .attr('y1', function (d) {
                    return d[0][1];
                })
                .attr('x2', function (d) {
                    return d[1][0];
                })
                .attr('y2', function (d) {
                    return d[1][1];
                })
        }

    }
    /* End Routes*/

    /** Helpers */
    // move function from https://bl.ocks.org/mbostock/4987520
    function move() {
        var t = d3.event.translate,
            s = d3.event.scale;
        t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
        t[1] = Math.min(height / 2 * (s - 1) + 230 * s, Math.max(height / 2 * (1 - s) - 230 * s, t[1]));
        zoom.translate(t);
        g.style('stroke-width', 1 / s).attr('transform', 'translate(' + t + ')scale(' + s + ')');
    }

    function renderGeoDetails(fileName, className) {
        return d3.json('assets/sfmaps/' + fileName + '.json', function (error, json) {
            if (error) throw error;
            g.selectAll('path')
                .data(json.features)
                .enter().append('path')
                .attr('class', className)
                .attr('d', path);
        });
    }

    function renderStreets() {
        return renderGeoDetails('streets', 'street');
    }

    function renderNeighborhoods() {
        return renderGeoDetails('neighborhoods', 'neighborhood');
    }

    /** Can be used if needed */
    // function renderArteries() {
    //     return renderGeoDetails('arteries', 'artery');
    // }

    // function renderFreeways() {
    //     return renderGeoDetails('freeways', 'freeway');       
    // }

    function loadRoutes() {
        return d3.json('http://webservices.nextbus.com/service/publicJSONFeed?command=routeConfig&a=sf-muni&t=0', function (error, json) {
            if (error) throw error;
            routesJson = json.route;
        });
    }

    function getSelectedRoutes() {
        var routeTags = [];
        var select = $('.selectpicker')[0];
        var options = select && select.options;
        var opt;

        for (var i = 0, iLen = options.length; i < iLen; i++) {
            opt = options[i];
            if (opt.selected) {
                routeTags.push(opt.value || opt.text);
            }
        }
        return routeTags;
    }
    /* End Helpers */
}());

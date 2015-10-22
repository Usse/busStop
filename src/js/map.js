import $ from 'jquery';
import _ from 'underscore';
import {configs as conf} from './configs';
import {mapStyles} from './map-styles';



var map = (function() {
  'use strict';

  var map = {

    theMap : null,
    pins : [],
    markers : [],

    init: function() {
      map.drawMap();
      map.bindEvents();
    },

    bindEvents : function() {
      google.maps.event.addListener(map.theMap, 'zoom_changed', function(){
        map.getPins();
      });
      google.maps.event.addListener(map.theMap, 'dragend', function(){
        map.getPins();
      });

      $('.close').on('click', function() {
        $('.infoBox').removeClass('visible');
        map.resetMarkersIcon();
      });

      $('.search--box input[type=submit]').on('click', map.searchBox);
    },

    drawMap: function() {
      map.theMap = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 51.5110519, lng: -0.08832141},
        zoom: 16,
        maxZoom: 17,
        minZoom: 15,
        disableDefaultUI: true
      });
      map.theMap.setOptions({styles: mapStyles});

      map.geolocalizeUser();

      google.maps.event.addListenerOnce(map.theMap, 'idle', function(){
        map.getPins();
      });
    },
    
    geolocalizeUser: function() {
      // Center the map based on HTML geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          map.theMap.setCenter(pos);
          var marker = new google.maps.Marker({
            position: pos,
            map: map.theMap,
            icon: 'images/user-24.png'
          });
          
          google.maps.event.addListenerOnce(map.theMap, 'tilesloaded', function(){
            map.getPins();
          });
        });
      }
    },

    getPins: function() {
      var URL = conf.URLS.BASE + conf.URLS.BUS_STOPS;
      $.ajax({
          url: URL,
          jsonp: "callback",
          dataType: "jsonp",
          data: { 
            northEast : map.theMap.getBounds().getNorthEast().lat() + ',' + map.theMap.getBounds().getNorthEast().lng(),
            southWest : map.theMap.getBounds().getSouthWest().lat() + ',' + map.theMap.getBounds().getSouthWest().lng()
          },
          success: function(data) {
            data.markers.forEach(function(p) {
              if (_.findWhere(map.pins, {id:p.id}) == null) {
                map.pins.push(p);
              }
            });
            map.drawPins();
          },
          error: function(data) {
            // alert(data.errorMessage);
          }
      });
    },

    drawPins: function() {
      map.pins.forEach(function(pin) {
        
        //Redraw pin only if is not currently present on the map
        if(!pin.isOnTheMap) {
          var myLatLng = {
            lat: pin.lat, 
            lng: pin.lng
          };
          var marker = new google.maps.Marker({
            position: myLatLng,
            map: map.theMap,
            icon: 'images/bus-24.png',
            title: ''
          });
          
          pin["isOnTheMap"] = true;
          marker.set("id", pin.id);
          marker.set("name", pin.name);
          map.markers.push(marker);

          map.clickOnPin(marker);

        }
      })
    },

    clickOnPin: function(marker) {
      google.maps.event.addListener(marker, 'click', function() {
        map.theMap.setZoom(17);
      
        map.theMap.setCenter(marker.getPosition());
        var center = map.theMap.getCenter();

        //center map according to overlay position and window width
        var offsetX = $(window).width() > 768 ? 0.25 : 0;
        var offsetY = $(window).width() > 768 ? 0 : -0.25;

        var span = map.theMap.getBounds().toSpan();
        var newCenter = { 
            lat: center.lat() + span.lat()*offsetY,
            lng: center.lng() + span.lng()*offsetX
        };
        map.theMap.panTo(newCenter);

        map.getPins();
        map.resetMarkersIcon();
        marker.setIcon("images/bus-24-active.png");  
        
        //Add addition information to the marker 
        var pinId = marker.get('id');
        var pinName = marker.get('name');
        map.showInfoBox(pinId, pinName);
      });
    },

    resetMarkersIcon: function() {
      //Reset icon for non active pins
      map.markers.forEach(function(elem) {
        elem.setIcon("images/bus-24.png");  
      })
    },

    showInfoBox: function(id,name) {
      var $infoBox = $('.infoBox');
      $infoBox.find("h3").text(name);

      var URL = conf.URLS.BASE + conf.URLS.BUS_STOPS + '/' + id;
      $.ajax({
          url: URL,
          jsonp: "callback",
          dataType: "jsonp",
          success: function(busStop) {
            map.displayInfoMessages(busStop.serviceDisruptions);
            map.displayDeparturesTable(busStop.arrivals);
            $infoBox.addClass('visible');
          },
          error: function(data) {
            // alert(data.errorMessage);
          }
      });
    },

    displayInfoMessages: function(serviceDisruptions) {
      // TODO : change display order to give more importance to criticalMessages
      $('.messages').empty();
      for (var property in  serviceDisruptions) {
        if (serviceDisruptions.hasOwnProperty(property)) {
          if(serviceDisruptions[property].length > 0) {
            $('.messages').append(`
              <span class=${property}> ${serviceDisruptions[property]} </span>
            `)
          }
        }
      }
    },

    displayDeparturesTable: function(arrivals) {
      var html = "";
      arrivals.forEach(function(arrival) {
        html += `<tr> 
          <td>${arrival.routeId}</td>
          <td>${arrival.destination}</td>
          <td>${arrival.estimatedWait}</td>
        </tr>`
      });

      if(arrivals.length === 0) {
        html = `<h4> ${conf.MESSAGES.NO_ARRIVALS} </h4>`;
      }

      $('.infoBox').find("tbody").empty().append(html);
    },

    searchBox: function() {
      var address = $('.search--box input[type=text]').val() + " London UK";
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.theMap.setCenter(results[0].geometry.location);
          map.getPins();
        } else {
          // alert(status);
        }
      });
    }

  };

  return map;
}());






export { map }

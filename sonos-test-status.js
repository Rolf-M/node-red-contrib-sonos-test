var sonos = require('@svrooij/sonos').SonosDevice;
//var SonosHelper = require('./SonosHelper.js');
//var helper = new SonosHelper();
const ServiceEvents = require('@svrooij/sonos').ServiceEvents;
const SonosEvents = require('@svrooij/sonos').SonosEvents;
var util = require("util");


module.exports = function(RED) {
	'use strict';

	function TestStatusNode(config) {

		RED.nodes.createNode(this, config);
		var node = this;
		var configNode = RED.nodes.getNode(config.confignode);
//		const listener = sonos.Listener;
		var speakers = configNode.speakers;
		Promise.resolve(speakers).then((devices) => {
			devices.forEach(d => RED.log.info(util.format('Found Sonos in node: %j', d.Name)));
			node.client = devices.find(x => x.name == config.speakername);
			if (node.client === null || node.client === undefined) {
				node.status({fill:"red", shape:"dot", text:"sonos client is null"});
				return;
			} else {
				node.status({fill:"green", shape:"dot", text:util.format('Connected to speaker: %j', node.client.Name)});
				RED.log.info(util.format('Connected to speaker: %j', node.client.Name));

				// SonosEvents
				node.client.Events.on(SonosEvents.CurrentTrack, uri => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CurrentTrackEvent",
						payload:uri
					};
					node.send(msg);
					//console.log('Current track changed %s', uri)
				});
				
				node.client.Events.on(SonosEvents.CurrentTrackMetadata, data => {
					var msg = {
					_msgid:RED.util.generateId(),
					topic:"TrackMetadataEvent",
					payload:data
					};
				node.send(msg);
				//console.log('Current track metadata %s', JSON.stringify(data))
				});

				node.client.Events.on(SonosEvents.Volume, volume => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"VolumeEvent",
						payload:volume
					};
				node.send(msg);
				//console.log('New volume %d', volume)
				});

				// Events from Services
				node.client.AlarmClockService.Events.on(ServiceEvents.Data, data => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"ServiceEvent",
						payload:data
					};
				node.send(msg);
				//console.log('AlarmClock data %s', JSON.stringify(data))
				});

				node.client.AVTransportService.Events.on(ServiceEvents.LastChange, data => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"AVTransportEvent",
						payload:data
					};
					node.send(msg);
					//console.log('AVTransport lastchange %s', JSON.stringify(data, null, 2))
				});
				node.client.RenderingControlService.Events.on(ServiceEvents.LastChange, data => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"RenderingEvent",
						payload:data
					};
				node.send(msg);
				//console.log('RenderingControl lastchange %s', JSON.stringify(data, null, 2))
				});
			
				node.client.GroupManagementService.Events.on(ServiceEvents.Data, data => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"GroupManagementEvent",
						payload:data
					};
				node.send(msg);
				//console.log('AlarmClock data %s', JSON.stringify(data))
				});			
			
			
			
			};		
		
		});
		


		//handle input message
		this.on('input', function (msg) {
			RED.log.info(util.format('Message for speaker: %j', node.client.Name))

			//console.log('Message received');
//			getAllStatus(node.client).then((payload) =>{
				//console.log('Got current AllStatus %j', payload);
				//Send output
			msg.topic = 'AllStatus';
			node.client.GetFavorites()
			.then(favorites => {
				msg.payload = favorites;
//			msg.payload = node.client;
				node.send(msg);
			});
				//	return;
//			});
		});
		
	}
	
	
	//------------------------------------------------------------------------------------------
     //Build API to auto detect IP Addresses
    RED.httpAdmin.get("/sonosLookup", function(req, res) {
        RED.log.debug("GET /sonosLookup");
        LookupSonos(function(devices) {
            RED.log.debug("GET /sonosSearch: " + devices.length + " found");
            res.json(devices);
        });
    });

    function LookupSonos(discoveryCallback) 
    {
		const SonosManager = require('@svrooij/sonos').SonosManager;
		RED.log.debug("Start Sonos discovery");
		const manager = new SonosManager()
		var dev_arr = manager.InitializeWithDiscovery(10)
//			.then(console.log)
			.then(() => {
			//	manager.Devices.forEach(d => console.log('Device %s (%s) is joined in %s', d.Name, d.uuid, d.GroupName))
				return manager.Devices.map(d => {return d.Name});
			});
		Promise.resolve(dev_arr)
			.then((List) => {
				RED.log.info(util.format('Sending: %j', List));
				discoveryCallback(List);
			});
		
    };

	//------------------------------------------------------------------------------------------

	
	RED.nodes.registerType('sonos-test-status', TestStatusNode);
};
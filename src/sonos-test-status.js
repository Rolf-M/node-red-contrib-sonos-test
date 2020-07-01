var sonos = require('@svrooij/sonos').SonosDevice;
//var SonosHelper = require('./SonosHelper.js');
//var helper = new SonosHelper();
//const ServiceEvents = require('@svrooij/sonos').ServiceEvents;
const SonosEvents = require('@svrooij/sonos/lib/models/sonos-events').SonosEvents;
var util = require("util");


module.exports = function(RED) {
	'use strict';

	function TestStatusNode(config) {

		RED.nodes.createNode(this, config);
		var node = this;
		var configNode = RED.nodes.getNode(config.confignode);
		node.manager = configNode.manager;
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
				
				node.client.Events.on(SonosEvents.Coordinator, uuid => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CoordinatorEvent",
						payload:uuid
					};
					node.send(msg);
					
					//console.log('Coordinator for %s changed to %s', d.Name, uuid)
				})
				node.client.Events.on(SonosEvents.GroupName, newName => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"GroupNameEvent",
						payload:newName
					};
					node.send(msg);
					
					//console.log('Groupname for %s changed to %s', d.Name, newName)
				})
				node.client.Events.on(SonosEvents.CurrentTrack, uri => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CurrentTrackEvent",
						payload:uri
					};
					node.send(msg);
					
					//console.log('Current Track for %s %s', d.Name, uri)
				})
				node.client.Events.on(SonosEvents.CurrentTrackMetadata, metadata => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CurrentTrackMetadataEvent",
						payload:metadata
					};
					node.send(msg);
					
					//console.log('Current Track metadata for %s %s', d.Name, JSON.stringify(metadata, null, 2))
				})
				node.client.Events.on(SonosEvents.NextTrack, uri => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"NextTrackEvent",
						payload:uri
					};
					node.send(msg);
					
					//console.log('Next Track for %s %s', d.Name, uri)
				})
				node.client.Events.on(SonosEvents.NextTrackMetadata, metadata => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"NextTrackMetadataEvent",
						payload:metadata
					};
					node.send(msg);
					
					//console.log('Next Track metadata for %s %s', d.Name, JSON.stringify(metadata, null, 2))
				})
				node.client.Events.on(SonosEvents.CurrentTransportState, state => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CurrentTransportStateEvent",
						payload:state
					};
					node.send(msg);
					
					//console.log('New state for %s %s', d.Name, state)
				})
				node.client.Events.on(SonosEvents.CurrentTransportStateSimple, state => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"CurrentTransportStateSimpleEvent",
						payload:state
					};
					node.send(msg);
					
					//console.log('New simple state for %s %s', d.Name, state)
				})
			
				node.client.Events.on(SonosEvents.Volume, volume => {
					var msg = {
						_msgid:RED.util.generateId(),
						topic:"VolumeEvent",
						payload:volume
					};
					node.send(msg);
					
					//console.log('New volume %d', volume)
				})
			
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

		this.on("close", function(done) {
			RED.log.info('cancelling sonos subscriptions')
			node.client.CancelEvents();
			//node.manager.CancelSubscription();
			//listener.stopListener().then(result => {
			//console.log('Cancelled all subscriptions');
			node.status({fill:"gray", shape:"dot", text:"sonos speaker disconnected"});
			done();
			//});
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
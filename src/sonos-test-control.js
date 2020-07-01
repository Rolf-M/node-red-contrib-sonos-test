var sonos = require('@svrooij/sonos').SonosDevice;
//var SonosHelper = require('./SonosHelper.js');
//var helper = new SonosHelper();
//const ServiceEvents = require('@svrooij/sonos').ServiceEvents;
const SonosEvents = require('@svrooij/sonos/lib/models/sonos-events').SonosEvents;
var util = require("util");


module.exports = function(RED) {
	'use strict';

	function TestControlNode(config) {

		RED.nodes.createNode(this, config);
		var node = this;
		var configNode = RED.nodes.getNode(config.confignode);
		node.manager = configNode.manager;
//		const listener = sonos.Listener;
		var speakers = configNode.speakers;
		Promise.resolve(speakers).then((devices) => {
			devices.forEach(d => RED.log.debug(util.format('Found Sonos in node: %j', d.Name)));
			node.client = devices.find(x => x.name == config.speakername);
			if (node.client === null || node.client === undefined) {
				node.status({fill:"red", shape:"dot", text:"sonos client is null"});
				return;
			} else {
				node.status({fill:"green", shape:"dot", text:util.format('Connected to speaker: %j', node.client.Name)});
				RED.log.info(util.format('Connected to speaker: %j', node.client.Name));
			};		
		
		});
		


		//handle input message
		this.on('input', function (msg) {
			RED.log.debug(util.format('Message for speaker: %j', node.client.Name));
			
			//Convert payload to lowercase string
			var payload = "";
			if (msg.payload !== null && msg.payload !== undefined && msg.payload) 
				payload = "" + msg.payload;
				payload = payload.toLowerCase();

			switch (payload)
			{
				case "pause":
					node.client.Pause()
						.catch(console.error);
					break;
					
				case "play":
					node.client.Play()
						.catch(console.error);
					break;
				
				case "previous":
					node.client.Previous()
						.catch(console.error);
					break;
					
				case "next":
					node.client.Next()
						.catch(console.error);
					break;
				
				case "play":
					node.client.play()
						.catch(console.error);
					break;
				
				case "stop":
					node.client.stop()
						.catch(console.error);
					break;
				
				case "mute":
					node.client.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: true })
						.then(resp => console.log(resp))
						.catch(console.error);
						
					break;
				
				case "unmute":
					node.client.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: false })
						.then(resp => console.log(resp))
						.catch(console.error);
						
					break;
				
				case "leave_group":
					node.client.AVTransportService.BecomeCoordinatorOfStandaloneGroup({ InstanceID: 0 })
						.then(resp => console.log(resp))
						.catch(console.error);
						
					break;

				case "join_group":
					//validation
					var deviceName = msg.topic;
					if (!deviceName) {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"msg.topic is not defined"});
						return;
					}
					
					node.client.JoinGroup(deviceName)
						.then(resp => console.log(resp))
						.catch(console.error);
						
					break;

				default:
					//Volume
					if (payload.startsWith('+') || payload.startsWith('-')) {
						node.client.SetRelativeVolume(payload)
						.then(resp => console.log(resp))
						.catch(console.error);
						
						
						
					} else if (!isNaN(parseInt(payload))) {
						node.client.SetVolume(payload)
						.then(resp => console.log(resp))
						.catch(console.error);
					
					};
				
				
				
			};


		});

		this.on("close", function(done) {
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

	
	RED.nodes.registerType('sonos-test-control', TestControlNode);
};
const SonosManager = require('@svrooij/sonos').SonosManager
var util = require("util");

module.exports = function(RED) 
{
    
	function SonosManagerNode(config) {
        RED.nodes.createNode(this, config);
		this.name = config.name;
		
		const manager = new SonosManager()
		var dev_arr = manager.InitializeWithDiscovery(10)
//			.then(console.log)
			.then(() => {
//				manager.Devices.forEach(d => console.log('Device %s (%s) is joined in %s', d.Name, d.uuid, d.GroupName))
				return manager.Devices;
			})
			.catch(e => {
				RED.log.warn(util.format(' Error in discovery %j', e));
			});
			
//		Promise.resolve(dev_arr).then((devices) => {
//			devices.forEach(d => RED.log.info(util.format('Found Sonos: %j', d.Name)));
//			this.speakers = devices;
		this.speakers = dev_arr;
//		})
		
/*        this.ipaddress = config.ipaddress;
		var hasIpAddress = config.ipaddress !== undefined && config.ipaddress !== null && config.ipaddress.trim().length > 5;
		if (!hasIpAddress)
			return;
		this.speaker = new Sonos.Sonos(config.ipaddress);
*/		
	}


    RED.nodes.registerType("sonos-test-config", SonosManagerNode);
};
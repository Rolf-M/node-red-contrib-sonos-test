# node-red-contrib-sonos-test
Sonos test nodes

using Sonos from svrooi https://github.com/svrooij/node-sonos-ts
based on a lot of experience from previous sonos development.

Not to be used in production, just for dev purposes

The config node only exists once and holds an instance of "sonos-manager".
You have to select the speaker you need to address within the node. It would be nice to have a rediscovery from within the config node, but for now, if you need to rediscover delete and add the config node again.


# bwplacebadapple
badapple renderer for bwplace (https://discord.gg/44r6v4XVcW)

## MORE SOURCES SOON

# Configuration

For configuring the script to your needs, change the variables on the top of the script
variable | type | description | default
* targetWidth | number | Image width on the canvas |  100
* targetHeight | number | Image height on the canvas | 90
* startAtX | number | X offset on the canvas | 0
* startAtY | number | Y offset on the canvas | 0
* fillMethod | number | Where to fill badapple from, 1 - horizontally, 2 - vertically | 2
* skipFrames | number | The frame to start/continue from if you're restarting the script | 0
* skipUnchangedPixels | boolean | Whether to skip rendering unchanged pixels in frames | true
* apiUrl | string | The bwplace updatePixel endpoint | http://5.59.97.201:6969/updatePixel
* socketUrl | string | Socket.io url to listen to pixel updates and fix them (optional) | http://5.59.97.201:6969/
* proxyUrl | string | The url of the http tor proxy loadbalancer to use when making the requests (optional) | http://127.0.0.1:3128/
* maxRetries | number | How many attempts to make while retrying to draw pixels | 5
* statsInterval | number | The interval (in ms) at which the stats message in the console updates, set to 0 to disable | 180000
* frameDir | string | The path to the directory that contains all the badapple frames | ./frames/
* delay | number | The delay in between making pixel update requests (in ms) | 10
* reloadFramesAt | number | When reloadFramesAt or less frames are cached, the script should load more frames | 100
* framesToLoad | number | The number of frames to load at once, recommended not to set it above 2000 frames as it affects ram usage | 1000
* delayBetweenFrames | number | The delay between the previous frame being finished and the new one being started (in ms) | 1000
* retryTimeout | number | The delay between retrying failed pixel update requests (in ms) | 50
* debug | boolean | Whether to log debug info | false

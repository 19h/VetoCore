VetoCore is a quite awesome and quick portable NodeJS proxy server.
It's full featured and supports SSL, you can build your own plugins
and make it work the way you love it. Use it for interception, 
analysis & reverse-engineering or just as a proxy-as-usual.

VetoCore is a hard-fork of nodejs-proxy by Peteris Krumins. (peter@catonmat.net)
Share and modify alike, but please credit, it feels good, improves Karma and
makes you remember where to update, when soon needed or wanted. :)

VetoCore currently is maintained by Kenan Sulayman, et al. and
IntellectualCommons inc. as an internal middleware. 

------------------------------------------------------------------------------

--- LINUX & OSX ---

++++ DARWIN ++++

If you're running OSX, consider installing the developer tools.
!+ If you're on Mountain Lion, install Xcode 4.4 first,
!+ then the latest Lion Xcode pakage.

++++ DARWIN on ARM / IOS ++++
Deploy on your ARM7+ device with `dpkg -i nodedarwin.deb`.
Works on iDevices 4th Gen (+).

++++ LINUX GENERIC X86_64 ++++
Obtain the execuables from `http://api.cld.me/EOwT/download/nodejs-0.6.11-1-x86_64.pkg.tar`.

You'll need node.js to run it. Get it at www.nodejs.org, then compile and
install it:

    $ ./configure
    $ make
    $ make install

Next, run proxy.js through node program:

    $ node proxy.js

There you go.

If you want to deploy plugins, put them into

    $ cd plugins

There's also an ip whitelist access controller. As long as no ip is explicitly denied,
all will be allowed. If you need a specic access list just echo it to
'allow_ip_list' file:

    $ echo '1.2.3.4' >> config/allow_ip_list

The server automatically reloads the configuration.

You can also block hosts based on a regex pattern, to do that, echo the hosts
you don't wish the proxy to serve to 'black_list' file:

    $ echo 'facebook.com' >> config/black_list

------------------------------------------------------------------------------

TODO:
	– Plugins

------------------------------------------------------------------------------


Have fun,
Kenan Sulayman
http://www.sulayman.org/

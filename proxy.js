var http = require("http"),
        util = require("util");
fs = require("fs");
config = require("./config").config;
blacklist = [];
iplist = [];
hostfilters = {};
function decode_host(a) {
        out = {};
        a = a.split(":");
        out.host = a[0];
        out.port = a[1] || 80;
        return out
}
function encode_host(a) {
        return a.host + (80 == a.port ? "" : ":" + a.port)
}
fs.watchFile(config.black_list, function () {
        update_blacklist()
});
fs.watchFile(config.allow_ip_list, function () {
        update_iplist()
});
fs.watchFile(config.host_filters, function () {
        update_hostfilters()
});
config.add_proxy_header = void 0 !== config.add_proxy_header && !0 == config.add_proxy_header;
function update_list(a, b, c, e) {
        fs.stat(b, function (a) {
                a ? (util.log("File '" + b + "' was not found."), e([])) : fs.readFile(b, function (a, b) {
                        e(b.toString().split("\n").filter(function (a) {
                                return a.length
                        }).map(c))
                })
        })
}

function update_hostfilters() {
        file = config.host_filters;
        fs.stat(file, function (a) {
                a ? (util.log("File '" + file + "' was not found."), hostfilters = {}) : fs.readFile(file, function (a, c) {
                        hostfilters = JSON.parse(c.toString())
                })
        })
}
function update_blacklist() {
        update_list("Updating host black list.", config.black_list, function (a) {
                return RegExp(a)
        }, function (a) {
                blacklist = a
        })
}
function update_iplist() {
        update_list("Updating allowed ip list.", config.allow_ip_list, function (a) {
                return a
        }, function (a) {
                iplist = a
        })
}

function ip_allowed(a) {
        return iplist.some(function (b) {
                return a == b
        }) || 1 > iplist.length
}
function host_allowed(a) {
        return !blacklist.some(function (b) {
                return b.test(a)
        })
}
function authenticate(a) {
        token = {
                login: "anonymous",
                pass: ""
        };
        a.headers.authorization && 0 === a.headers.authorization.search("Basic ") && (basic = (new Buffer(a.headers.authorization.split(" ")[1], "base64")).toString(), util.log("Authentication token received: " + basic), basic = basic.split(":"), token.login = basic[0], token.pass = basic[1]);
        return token
}

function handle_proxy_rule(a, b, c) {
        if ("validuser" in a && (!(c.login in a.validuser) || a.validuser[c.login] != c.pass)) return b.action = "authenticate", b.msg = a.description || "", b;
        "redirect" in a ? (b = decode_host(a.redirect), b.action = "redirect") : "proxyto" in a && (b = decode_host(a.proxyto), b.action = "proxyto");
        return b
}

function handle_proxy_route(a, b) {
        action = decode_host(a);
        action.action = "proxyto";
        action.host + ":" + action.port in hostfilters ? (rule = hostfilters[action.host + ":" + action.port], action = handle_proxy_rule(rule, action, b)) : action.host in hostfilters ? (rule = hostfilters[action.host], action = handle_proxy_rule(rule, action, b)) : "*:" + action.port in hostfilters ? (rule = hostfilters["*:" + action.port], action = handle_proxy_rule(rule, action, b)) : "*" in hostfilters && (rule = hostfilters["*"], action = handle_proxy_rule(rule, action, b));
        return action
}
function prevent_loop(a, b) {
        if ("node.jtlebi" == a.headers.proxy) return util.log("Loop detected"), b.writeHead(500), b.write("Proxy loop !"), b.end(), !1;
        a.headers.proxy = "node.jtlebi";
        return a
}
function action_authenticate(a, b) {
        a.writeHead(401, {
                "WWW-Authenticate": 'Basic realm="' + b + '"'
        });
        a.end()
}
function action_deny(a, b) {
        a.writeHead(403);
        a.write(b);
        a.end()
}
function action_notfound(a, b) {
        a.writeHead(404);
        a.write(b);
        a.end()
}

function action_redirect(a, b) {
        util.log("Redirecting to " + b);
        a.writeHead(301, {
                Location: "http://" + b
        });
        a.end()
}

function action_proxy(a, b, c) {
        util.log("Proxying to " + c);
        var e = 1 == b.httpVersionMajor && 1 > b.httpVersionMinor || 1 > b.httpVersionMajor,
                d = b.headers;
        //config.add_proxy_header && (d["X-Forwarded-For"] = void 0 !== d["X-Forwarded-For"] ? b.connection.remoteAddress + ", " + d["X-Forwarded-For"] : b.connection.remoteAddress);
        var d = http.createClient(action.port, action.host),
                g = d.request(b.method, b.url, b.headers);
        d.on("error", function (h) {
                util.log(h.toString() + " on request to " + c);
                return action_notfound(a, "Requested resource (" + b.url + ') is not accessible on host "' + c + '"')
        });
        g.addListener("response", function (c) {
                if (e && void 0 != c.headers["transfer-encoding"]) {
                        console.log("legacy HTTP: " + b.httpVersion);
                        var d = c.headers;
                        delete c.headers["transfer-encoding"];
                        var f = "";
                        c.addListener("data", function (a) {
                                f += a
                        });
                        c.addListener("end", function () {
                                d["Content-length"] = f.length;
                                a.writeHead(c.statusCode, d);
                                a.write(f, "binary");
                                a.end()
                        })
                } else a.writeHead(c.statusCode, c.headers), c.addListener("data", function (b) {
                        a.write(b, "binary")
                }), c.addListener("end", function () {
                        a.end()
                })
        });
        b.addListener("data", function (a) {
                g.write(a, "binary")
        });
        b.addListener("end", function () {
                g.end()
        })
}
function security_log(a, b, c) {
        c = "**SECURITY VIOLATION**, " + a.connection.remoteAddress + "," + (a.method || "!NO METHOD!") + " " + (a.headers.host || "!NO HOST!") + "=>" + (a.url || "!NO URL!") + "," + c;
        util.log(c)
}
function security_filter(a, b) {
        return void 0 === a.headers.host || void 0 === a.method || void 0 === a.url ? (security_log(a, b, "Either host, method or url is poorly defined"), !1) : !0
}

function server_cb(a, b) {
        if (security_filter(a, b)) {
                var c = a.connection.remoteAddress;
                if (ip_allowed(c)) if (host_allowed(a.url)) {
                        (a = prevent_loop(a, b)) && util.log(c + ": " + a.method + " " + a.headers.host + "=>" + a.url), authorization = authenticate(a), c = handle_proxy_route(a.headers.host, authorization), host = encode_host(c), "redirect" == c.action ? action_redirect(b, host) : "proxyto" == c.action ? action_proxy(b, a, host) : "authenticate" == c.action && action_authenticate(b, c.msg)
                } else msg = "Host " + a.url + " has been denied by proxy configuration", action_deny(b, msg), security_log(a, b, msg);
                else msg = "IP " + c + " is not allowed to use this proxy", action_deny(b, msg), security_log(a, b, msg)
        }
}
update_blacklist();
update_iplist();
update_hostfilters();
config.listen.forEach(function (a) {
        util.log("Starting reverse proxy server on port '" + a.ip + ":" + a.port);
        http.createServer(server_cb).listen(a.port, a.ip)
});
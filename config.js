exports.config = {
        add_proxy_header: false,
        allow_ip_list: './config/allow_ip_list',
        black_list: './config/black_list',
        host_filters: './config/hostfilters.js',
        listen: [{ // Repeat each entry per device and socket to listen on!
                ip: '0.0.0.0', // IPv4
                port: 9000
        },
        {
                ip: '::', // IPv6
                port: 9000
        }]
};
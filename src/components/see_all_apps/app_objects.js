
// block category across network
export const categoryNetworkObject = {
    action: 'BLOCK',
    app_category_ids: [5],
    app_ids: [],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: 'Email Messaging Services',
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP_CATEGORY',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
}

// block category across device
export const categoryDeviceObject = {
    action: 'BLOCK',
    app_category_ids: [5],
    app_ids: [],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: 'Email Messaging Services',
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP_CATEGORY',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
    target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
}

// block app across device(s)
export const appObject = {
    action: 'BLOCK',
    app_category_ids: [],
    app_ids: [ 1111 ],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: 'Email Messaging Services',
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP_CATEGORY',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
    target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
}
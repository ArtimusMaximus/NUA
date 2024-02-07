
// block category across network
export const categoryNetworkObject = {
    action: 'BLOCK',
    app_category_ids: [],
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

// block category across device(s)
export const categoryDeviceObject = {
    action: 'BLOCK',
    app_category_ids: [],
    app_ids: [],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: '', // e.g. 'Media Streaming Services'
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP_CATEGORY',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    target_devices: []
    // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
    // target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
}
export const dbCategoryDeviceObject = {
    action: 'BLOCK',
    app_category_ids: [],
    app_ids: [],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: '', // e.g. 'Media Streaming Services'
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP_CATEGORY',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    target_devices: [],
    devices: [] // added for db
    // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
    // target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
}

// block app across device(s)
export const appDeviceObject = {
    action: 'BLOCK',
    app_category_ids: [],
    app_ids: [],
    bandwidth_limit: {
      download_limit_kbps: 1024,
      enabled: false,
      upload_limit_kbps: 1024
    },
    description: '',
    domains: [],
    enabled: true,
    ip_addresses: [],
    ip_ranges: [],
    matching_target: 'APP',
    network_ids: [],
    regions: [],
    schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
    // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
    // target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
    target_devices: [],
}
export const appDbDeviceObject = {
  action: 'BLOCK',
  app_category_ids: [],
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
  matching_target: 'APP',
  network_ids: [],
  regions: [],
  schedule: { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false },
  // target_devices: [ { network_id: '63c9eee5bf79960e3813bb10', type: 'NETWORK' } ]
  // target_devices: [ { client_mac: 'd8:31:34:5f:01:12', type: 'CLIENT'} ]
  target_devices: [],
  devices: [],
  appSelection: []
}

export const appNetworkObject = {
    action: 'BLOCK',
    app_category_ids: [],
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

// needs

// fetch network_id, type NETWORK
// fetch mac_address, type CLIENT
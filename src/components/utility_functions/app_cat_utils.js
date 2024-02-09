import { allAppsList } from "../../traffic_rule_apps/unifi_match_list";
import { useGetAllDevices } from "../custom_hooks/useGetAllDevices";
import {
    dbCategoryDeviceObject,
    appDbDeviceObject,
} from "../see_all_apps/app_objects";



export const allAppNames = (allAppsList = allAppsList) => {
    const allAppsNamesIds = allAppsList.map((obj) => {
        return obj.apps.map((nameId) => {
            return { name: nameId.name, id: nameId.id }
        });
    });
    return allAppsNamesIds.flat()
}
export function appNameFinder(unifiObjectArray, masterList = allAppsList) {
    const matched = masterList.filter(masterList =>
        unifiObjectArray.some(unifiId =>
            unifiId.app_ids.includes(masterList.id)
            )
        );
    const nameAndId = matched.map(item => ({ id: item.id, name: item.name }));
    return nameAndId;
}

export function getDeviceFromMac(allDeviceList, existingDeviceList, macArray, dbObject) { // uses allClientDevices(), not just applied ones
    const checkForNetworkIds = macArray.target_devices.filter(td => Object.keys(td).includes("network_id"));
    const checkForClientMac = macArray.target_devices.filter(td => Object.keys(td).includes("client_mac"));
    // we are extracting only the target_device data here

    if (checkForNetworkIds.length) {
        return dbObject;
    } else if (checkForClientMac.length) {
        const matchDataToExistingDevices = existingDeviceList.filter(device => checkForClientMac.some(c => c.client_mac === device.macAddress));
        const matchDataToAllDevices = allDeviceList.filter(device => checkForClientMac.some(c => c.client_mac === device.mac));

        if (matchDataToExistingDevices.length) {
            const updatedObject = matchDataToExistingDevices.map(existsDeviceData => {
                // console.log('existsDeviceData \t', existsDeviceData); // === unifi device data
                const updatedDbObject = {
                    ...dbObject,
                    devices: [{ deviceName: existsDeviceData.oui, macAddress: existsDeviceData.macAddress, deviceId: existsDeviceData.id }]
                }
                return updatedDbObject;
            })
            return updatedObject;
        } else { // matchData to All Device List
            // console.log('matchDataToAllDevices \t', matchDataToAllDevices);
            const updatedObject = matchDataToAllDevices.map(newData => {
                console.log('newData \t', newData);
                const updatedDbObject = {
                    ...dbObject,
                    devices: [{ deviceName: newData.oui, macAddress: newData.mac }] // deviceId: Int needs to be
                    // deviceId: newData._id, not available
                    // need deviceName, deviceId, macAddress
                }
                // console.log('updatedObject \t', updatedDbObject);
                return updatedDbObject;
            })
            console.log('updatedObject  matchDataToAllDevices\t', updatedObject);
            return updatedObject;
        }
    } else {
        return dbObject;
    }
}


export function importToDbConverter(importedRules, allDeviceList, existingDeviceList) {
    const categoryClones = [];
    const appClones = [];

    for (let i = 0; i < importedRules.length; i+=1) {
        const dbCategoryDeviceObjectClone = JSON.parse(JSON.stringify(dbCategoryDeviceObject));
        const appDbDeviceObjectClone = JSON.parse(JSON.stringify(appDbDeviceObject));
        const internetDbDeviceObjectClone = JSON.parse(JSON.stringify(dbCategoryDeviceObject));

        if (importedRules[i].matching_target === "APP") {
            const importDBAppObject = { ...importedRules[i], ...appDbDeviceObjectClone[i] };
            getDeviceFromMac(allDeviceList, existingDeviceList, importedRules[i], importedRules[i])

            // const { updatedDbObject } = getDeviceFromMac(allDeviceList, existingDeviceList, importedRules[i], importedRules[i]);
            // if (updatedDbObject.devices.length) {
            //     importDBAppObject?.devices?.push(...updatedDbObject);
            // } else {
            //     console.log('no array length')
            // }

            appClones.push(importDBAppObject)
        } else if (importedRules[i].matching_target === "APP_CATEGORY") {
            const importDBCatObject = { ...importedRules[i], ...dbCategoryDeviceObjectClone[i] }
            getDeviceFromMac(allDeviceList, existingDeviceList, importedRules[i], importedRules[i])
            // const { updatedDbObject } = getDeviceFromMac(allDeviceList, existingDeviceList, importedRules[i], importedRules[i]);
            // if (updatedDbObject.devices.length) {
            //     importDBCatObject?.devices?.push(...updatedDbObject);
            // } else {
            //     console.log('no array length')
            // }

            categoryClones.push(importDBCatObject)
        } else if (importedRules[i].matching_target === "INTERNET") {
            const importDBInternetCatObject = { ...importedRules[i], ...internetDbDeviceObjectClone[i] }
            getDeviceFromMac(allDeviceList, existingDeviceList, importedRules[i], importedRules[i])

            categoryClones.push(importDBInternetCatObject)
        }
    }
    return { categoryClones, appClones }
}




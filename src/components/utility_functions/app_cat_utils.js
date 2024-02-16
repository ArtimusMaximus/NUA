import { allAppsList } from "../../traffic_rule_apps/unifi_match_list";
import { useGetAllDevices } from "../custom_hooks/useGetAllDevices";
import {
    dbCategoryDeviceObject,
    appDbDeviceObject,
} from "../see_all_apps/app_objects";

function flattenAll (arr) {
    return arr.flat(Infinity)
}
export const allAppNames = () => {
    const allAppsNamesIds = allAppsList.map((obj) => {
        return obj.apps.map((nameId) => {
            return { name: nameId.name, id: nameId.id };
        });
    });
    return allAppsNamesIds.flat()
}
export const allCatNames = () => {
    const allCatNames = allAppsList.map((obj) => {
        return { name: obj.cat, id: obj.catId };
    });
    return allCatNames;
}
export const createMatchingAppNames = (allAppNames, deviceAppsList) => {
    const matches = allAppNames.filter(app =>
        deviceAppsList.some(appId =>
            appId === app.id
        )
    );
    // console.log(matches);
    return matches;
}
export const createMatchingCatNames = (allCatNames, deviceCatList) => {
    const matches = allCatNames.filter(cat =>
        deviceCatList.some(catId =>
            catId === cat.catId
        )
    );
    // console.log(matches);
    return matches;
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
        const copy = { ...dbObject, devices: [] }
        return copy;
    } else if (checkForClientMac.length) {
        const matchDataToExistingDevices = existingDeviceList.filter(device => checkForClientMac.some(c => c.client_mac === device.macAddress));
        const matchDataToAllDevices = allDeviceList.filter(device => checkForClientMac.some(c => c.client_mac === device.mac));
        if (matchDataToExistingDevices.length) {
            const updatedObject = matchDataToExistingDevices.map(existsDeviceData => {
                const updatedDbObject = [{ deviceName: existsDeviceData.oui, macAddress: existsDeviceData.macAddress, deviceId: existsDeviceData.id }]
                return updatedDbObject;
            });
            console.log('updatedObject matchDataToExistingDevices \t', updatedObject);
            return updatedObject;
        } else { // matchData to All Device List
            const updatedObject = matchDataToAllDevices.map(newData => {
                const updatedDbObject = [{ deviceName: newData.oui, macAddress: newData.mac }] // deviceId: Int needs to be
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
            const importDBAppObject = { ...appDbDeviceObjectClone, ...importedRules[i] };
            console.log('importDBAppObject \t', importDBAppObject);

            const appMatches = createMatchingAppNames(allAppNames(), importDBAppObject.app_ids);
            const catMatches = createMatchingCatNames(allAppNames(), importDBAppObject.app_category_ids)

            if (appMatches.length) {
                importDBAppObject.appSelection.push(...appMatches)
            }

            const deviceList = getDeviceFromMac(allDeviceList, existingDeviceList, importDBAppObject, importDBAppObject);
            if (deviceList.length) {
                const c = flattenAll(deviceList)
                importDBAppObject.devices.push(...c)
            } else {
                importDBAppObject.devices = [];
            }
            appClones.push(importDBAppObject)
        } else if (importedRules[i].matching_target === "APP_CATEGORY") {
            const importDBCatObject = { ...dbCategoryDeviceObjectClone, ...importedRules[i]  };

            const deviceList = getDeviceFromMac(allDeviceList, existingDeviceList, importDBCatObject, importDBCatObject);

            if (deviceList.length) {
                const c = flattenAll(deviceList)
                importDBCatObject.devices.push(...c);
            } else {
                importDBCatObject.devices = [];
            }
            categoryClones.push(importDBCatObject)
        } else if (importedRules[i].matching_target === "INTERNET") {
            const importDBInternetCatObject = { ...internetDbDeviceObjectClone, ...importedRules[i] };

            const deviceList = getDeviceFromMac(allDeviceList, existingDeviceList, importDBInternetCatObject, importDBInternetCatObject);

            if (deviceList.length) {
                const c = flattenAll(deviceList);
                importDBInternetCatObject.devices.push(...c);
            } else {
                importDBInternetCatObject.devices = [];
            }
            categoryClones.push(importDBInternetCatObject);
        }
    }
    return { categoryClones, appClones }
}




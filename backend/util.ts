export const withReference = <T1,T2>(obj:T1, callback:(obj:T1) => T2):T2 => callback(obj)
export const zip = <T1,T2>(arr1:T1[], arr2:T2[]):[T1,T2][] => arr1.map((ai,i) => [ai,arr2[i]])


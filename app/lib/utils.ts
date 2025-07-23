import { signOut } from '@/auth';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { executeDataRequest } from '@/app/lib/db';

const branchCodes = {
    100: "HEAD OFFICE",
    106: "BOMA",
    107: "VICTOIRE",
    108: "NGABA",
    109: "KATUBA",
    110: "LIKASI",
    111: "KINTAMBO",
    112: "N'DJILI",
    113: "BUKAVU 1",
    114: "KOLWEZI",
    115: "BEL AIR",
    116: "LIMETE",
    118: "BUKAVU 2",
    119: "MATETE",
    120: "GOMA",
    121: "KISANGANI",
    101: "GOMBE",
    102: "MASINA",
    103: "MATADI",
    104: "LUBUMBASHI",
    105: "UPN",
    122: "MBUJI MAYI",
    123: "KANANGA",
    124: "MOBILE",
    126: "DURBA",
    125: "KALEMIE",
    130: "GOMA-KIND",
    131: "MBUJIMAYI-MWE",
    132: "KANANGA-TSHIK",
    133: "KANANGA-TSHIM",
    138: "UPN-KISANTU",
    144: "BELAIR-KAM",
    127: "KISANGANI-BUT",
    128: "KISANGANI-BUN",
    145: "KATUBA-KASUM",
    129: "KISANGANI-ISI",
    134: "BOMA-MOA",
    135: "FINCA TRANSFER",
    137: "UPN-BAZANG",
    140: "LIKASI-FUNG",
    141: "DURBA-ARU",
    136: "MATADI-KIMP",
    142: "KOLWEZI-MWAN",
    143: "LIKASI-KAMB"
  };

  const departmentCodes = {
    1: "CEO",
    2: "Finance",
    3: "Administration",
    4: "Marketing",
    5: "Banking Services",
    6: "Human Resources",
    7: "Operations",
    8: "Information Technology",
    9: "Legal",
    10: "New Business Devt",
    11: "Internal Audit",
    12: "Internal Control",
    13: "Call Center Department",
    14: "Risk department",
    731: "FINCA TRANSFERT"
  };

  
export function getKeyFromValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value) || null;
}  
  
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkSession(url: string){

    //get the last login date from session storage
    const lastLoginDate = sessionStorage.getItem("last_login_date")
    if(lastLoginDate){

        const savedTS = Number(lastLoginDate);
        const nowTS = Number(Date.now());

        // Calculate difference in seconds       
        const diffInSeconds = Math.abs(savedTS - nowTS) / 1000;

        console.log("Difference in seconds:", diffInSeconds, savedTS, nowTS);

        if(diffInSeconds < 6000){
            //extend
            sessionStorage.setItem("last_login_date", String(Date.now()))
        } else {
            //session expired, disconect 
            signOut({
                redirect: true,
                redirectTo: url
            });
        }
    }
}

export async function createRequestNo(branch: string, dpt: string){

    const deptCode = String(getKeyFromValue(departmentCodes, dpt)).toString().padStart(3, '0');
    const branchCode = String(getKeyFromValue(branchCodes, branch));
    const dt = new Date()
    // 100/125/2024/02/27/003						
	const code = `${branchCode}/${deptCode}/${dt.getFullYear()}/${String(dt.getMonth()).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}`
    // const queryStr = `
    //     SELECT isnull(CONVERT(INT, right(max(request_no), 3)), 0) seq
    //     FROM requisition 
    //     where [request_no] like '%${code}%' `;
    // const result = await executeDataRequest(queryStr, [], false);
    // if(result && result.length > 0){
    //      code = code + `${String(Number(result[0].seq + 1)).padStart(3, '0')}`
    // }

    return code; 
   
}

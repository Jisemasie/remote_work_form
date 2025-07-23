'use server'

import { executeDataRequest } from '@/app/lib/db';
import { SearchParams, InputParam } from './definitions';    
import { z } from 'zod';
import { FormulaireSchema } from '../schemas/formulaire';

type Formulaire = z.infer<typeof FormulaireSchema>;

// Search for formulaire
export async function searchFormulaire(i_params: SearchParams) {  
    try {  
        const { scope, value: search_value } = i_params;
        let queryCondition = 'WHERE 1 = 1';

        if (search_value === '*') queryCondition = ' WHERE 1 = 1 ';
        if (scope === 'req_id') queryCondition += ` AND id = ${search_value} `;
        if (scope === 'req_no') queryCondition += ` AND request_no = '%${search_value}%' `;
        if (scope === 'req_dt') queryCondition += ` AND request_dt = '%${search_value}' `;
        if (scope === 'all') queryCondition = 'WHERE 1 = 1';
        
        const queryStr = `
        SELECT 
            
        FROM [dbo].[requisition]
        ${queryCondition}`;
        const result = await executeDataRequest(queryStr, [], false);
        //console.log('User search result: ', result);
        return result;
    } catch (error) {    
        console.log(error);  
        return null;
    }  
}

// Create or update a formulaire
export async function createorUpdateFormulaire(req: Formulaire) {  

    console.log("Calling createorUpdateFormulaire: ", req)
    try { 

        //delete not needed fields
        const excludedFields = ['create_dt', 'update_dt'];

        const inputParam: InputParam[] = [];
        Object.entries(req).forEach(([key, value]) => {
            if(!excludedFields.includes(key)){
                inputParam.push({
                    key: key, 
                    value: String(value)
                });
            }
        });

        const result = await executeDataRequest("sp_CreateOrUpdateRequisition", inputParam, true);

        console.log("create requisition result: ", result);

        return result;

    } catch (error) {   
        console.log(error); 
        return null;
    }  
}

import { supabase } from './supabaseClient';

export const dbService = {
    // 1. PROPERTIES (Mapeado exatamente para a tabela 'properties' e 'owner_id')
    async getProperties(ownerId) {
        const {data, error} = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', ownerId);
        if (error) throw error;
        return data;
    },

    // 2. QUERY RELACIONAL DETALHADA (Cruza dados de Contexto da IA e Clientes vinculados)
    async getPropertyFullDetails(propertyId) {
        const propertyQuery = supabase.from('properties').select('*').eq('id', propertyId).single();
        const contextQuery = supabase.from('property_context').select('*').eq('property_id', propertyId);
        const clientsQuery = supabase
            .from('property_clients')
            .select('id, user_id, access_expires_at, is_active, users(full_name, email)')
            .eq('property_id', propertyId);

        const [propertyRes, contextRes, clientsRes] = await Promise.all([
            propertyQuery,
            contextQuery,
            clientsQuery
        ]);

        if (propertyRes.error) throw propertyRes.error;

        return {
            ...propertyRes.data,
            contexto: contextRes.data || [],
            clientes: clientsRes.data || []
        };
    },

    // 3. PROPERTY CONTEXT (Dados de treino/instruções para a IA)
    async addPropertyContext(contextData) {
        const {data, error} = await supabase
            .from('property_context')
            .insert([contextData])
            .select();
        if (error) throw error;
        return data[0];
    },

    // 4. PROPERTY CLIENTS (Hóspedes / Clientes vinculados)
    async addPropertyClient(propertyId, userId, expiresAt = null, phone = null){
        const {data, error} = await supabase
            .from('property_clients')
            .insert({
                property_id: propertyId,
                user_id: userId,
                access_expires_at: expiresAt,
                is_active: true,
                phone: phone,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async registerLead(leadData) {
        const {error} = await supabase
            .from('leads')
            .insert([leadData]);
        if (error) throw error;
    },

    // 6. CREATE PROPERTY (Onboarding)
    async createProperty(propertyData) {
        const {data, error} = await supabase
            .from('properties')
            .insert([propertyData])
            .select();
        if (error) throw error;
        return data[0];
    },

    // 7. CREATE PROPERTY CONTEXT (Onboarding)
    async createPropertyContext(contextItems) {
        const {error} = await supabase
            .from('property_context')
            .insert(contextItems);
        if (error) throw error;
    },

    // 8. CREATE PROPERTY UTILITIES (Onboarding)
    async createPropertyUtilities(utilityItems) {
        const {error} = await supabase
            .from('property_utilities')
            .insert(utilityItems);
        if (error) throw error;
    },
    // DELETE PROPERTIES
    async deleteProperty(propertyId){
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', propertyId);
        if (error) throw error;
        return true;
    },

    async getUserByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('email', email)
            .maybeSingle();
        if (error) throw error;
        return data;
    },
    async removePropertyClient(clientId) {
        const { error } = await supabase
            .from('property_clients')
            .delete()
            .eq('id', clientId);
        if (error) throw error;
        return true;
    },
    async getClientProperties(userId) {
        const { data, error } = await supabase
            .from('property_clients')
            .select(`
            id,
            access_expires_at,
            is_active,
            properties (
                id,
                name,
                address,
                description,
                owner_id,
                property_context (
                    id,
                    feature_key,
                    feature_value,
                    is_visible_to_client
                )
            )
        `)
            .eq('user_id', userId)
            .eq('is_active', true)
            .or('access_expires_at.is.null,access_expires_at.gt.' + new Date().toISOString());
        if (error) throw error;
        return data || [];
    },

    async updateProperty(propertyId, updates) {
        const { data, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', propertyId)
            .select();
        if (error) throw error;
        return data[0];
    },

    async updatePropertyContext(contextId, value){
        const { data, error} = await supabase
            .from('property_context')
            .update({feature_value: value})
            .eq('id', contextId)
            .select();
        if (error) throw error;
        return data[0];
    },

    async deletePropertyContext(contextId) {
        const { error } = await supabase
            .from('property_context')
            .delete()
            .eq('id', contextId);
        if (error) throw error;
        return true;
    }



};


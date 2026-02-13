
// Import Supabase client from CDN (assumes it's loaded in index.html)
// using 'supabase' global variable

export function createClient(supabaseUrl, supabaseKey) {
    if (!window.supabase) {
        throw new Error('Supabase client script not loaded');
    }
    return window.supabase.createClient(supabaseUrl, supabaseKey);
}

export async function signInWithGoogle(client) {
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    if (error) throw error;
    return data;
}

export async function signOut(client) {
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser(client) {
    const { data: { user } } = await client.auth.getUser();
    return user;
}

export async function saveStudyMaterial(client, title, filename, studyGuide, quizData) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('User not logged in');

    const { data, error } = await client
        .from('study_materials')
        .insert([
            {
                user_id: user.id,
                title: title,
                original_filename: filename,
                study_guide_content: studyGuide,
                quiz_data: quizData
            }
        ])
        .select();

    if (error) throw error;
    return data;
}

export async function getStudyMaterials(client) {
    const { data: { user } } = await client.auth.getUser();
    if (!user) return [];

    const { data, error } = await client
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

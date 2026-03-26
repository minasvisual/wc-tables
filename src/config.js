/**
 * config.js
 * Global configuration for the wc-table component.
 * Following the pattern of wc-forms-kit.
 */

export const Config = {
    lang: 'pt-br',
    plugins: {}, // Store for custom plugins
    translations: {
        'pt-br': {
            searchPlaceholder: 'Filtrar resultados...',
            noResults: 'Nenhum resultado encontrado.',
            waitingData: 'Aguardando dados...',
            id: 'ID',
            nome: 'Nome',
            email: 'E-mail',
            cargo: 'Cargo',
            departamento: 'Departamento',
            data_criacao: 'Data de Criação',
            salario: 'Salário',
            status: 'Status'
        },
        'en': {
            searchPlaceholder: 'Filter results...',
            noResults: 'No results found.',
            waitingData: 'Waiting for data...',
            id: 'ID',
            nome: 'Name',
            email: 'Email',
            cargo: 'Position',
            departamento: 'Department',
            data_criacao: 'Creation Date',
            salario: 'Salary',
            status: 'Status'
        }
    },
    
    /**
     * Translate a key based on the current language.
     * @param {string} key 
     * @returns {string}
     */
    t(key) {
        const langDict = this.translations[this.lang] || this.translations['en'];
        return langDict[key] || key;
    },

    /**
     * Update the global language.
     * @param {string} lang 
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.lang = lang;
        }
    },

    /**
     * Register a custom column plugin.
     * @param {string} name 
     * @param {class} pluginClass 
     */
    registerPlugin(name, pluginClass) {
        this.plugins[name] = pluginClass;
    }
};

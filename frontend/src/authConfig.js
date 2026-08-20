export const msalConfig = {
    auth: {
        clientId: "INGRESA_TU_CLIENT_ID_AQUI", // Reemplazar con el Client ID de la App en Azure AD
        authority: "https://login.microsoftonline.com/common", // Reemplazar "common" por el Tenant ID de AUBASA si es necesario
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["User.Read"]
};

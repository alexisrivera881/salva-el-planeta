# React JS Landing Page Template

**

# 🛎️🛎️ Good news! New & improved [V2](https://github.com/issaafalkattan/react-landing-page-template-2021) is out  

**


### <a href="https://react-landing-page-template-93ne.vercel.app/">LIVE DEMO</a> 

## Description
This is a ReactJS based landing page template, fit for a startup company/service with a one page view. The design is inspired by a template from <a href="https://www.free-css.com/assets/files/free-css-templates/preview/page234/interact/">Free-CSS.com </a>
All 'visual' data can be easily modified by changing the data.json file.

## Make it Yours!
### 1. Preps
You will need to have <a href="https://nodejs.org/">Node JS</a> installed on your pc. 

### 2. Clone Files
After cloning the files, you will have to run ```yarn``` followed by ```yarn start``` in the CLI
### 3. Add your own data 
Change the data in the ```data.json``` file as well as add any images to ```public/img/```
You can also change styles by modifying the ```public/css``` files.
If you need the contact form to work, you also need to create an EmailJS account, and modify the ```src/components/contact.jsx``` file to replace your own service ID, template ID and Public Key

## Panel de Administrador

El navbar incluye un menú **Administrador** con submenús que abren un panel de gestión (overlay) conectado a Supabase:

- **Panel** — KPIs: donaciones, monto recaudado, voluntarios y alianzas pendientes.
- **Donaciones** — listado, filtro por estado y cambio de estado (`pending/approved/rejected/refunded/cancelled`).
- **Voluntarios** — listado y cambio de estado (`pending/active/inactive`).
- **Alianzas Corporativas** — listado y cambio de estado (`pending/active/expired/rejected`).
- **Transacciones** — log de pagos de Mercado Pago (`payment_transactions`).

### Configuración (requerido)

1. Aplica la migración `supabase/migrations/002_admin_panel.sql` (desde el SQL Editor de Supabase o con `supabase db push`).
2. Fija la clave del panel (mínimo 6 caracteres):

```sql
SELECT planeta.admin_set_key('TuClaveSegura');
```

3. Ingresa esa clave en el menú Administrador del sitio. La clave se guarda en `sessionStorage` y se valida contra un hash bcrypt en `planeta.admin_config`.

Los listados de Donaciones/Voluntarios/Alianzas funcionan sin clave (RLS permite lectura); cambiar estados y ver Transacciones requiere la clave.

## Like this project?
<a href="https://www.buymeacoffee.com/issaaf">Buy my a coffee ☕️</a>

## Credits
##### Free CSS 
<a href="https://www.free-css.com/assets/files/free-css-templates/preview/page234/interact/">Free-CSS.com </a>

##### Issaaf kattan

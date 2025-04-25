

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { chain } from 'lodash';
import React, { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';

/* ***Layouts**** */
const FullLayout = lazy(() => import('../layouts/full/FullLayout'));
const BlankLayout = lazy(() => import('../layouts/blank/BlankLayout'));

/* ****Pages Proyecto Booths***** */
const Dashboard = lazy(() => import("../views/dashboard/page"));
const ListUsers = lazy(() => import("../views/users/listUsers"));
const ListProfiles = lazy(() => import("../views/profiles/listProfiles"));
const ListEmployes = lazy(() => import("../views/employees/listEmployes"));
const DataUpload = lazy(() => import("../views/data_upload/uploadFile"));
const PredictiveAnalysis = lazy(() => import("../views/predictive_analysis/predictive_analysis"));
const Reports = lazy(() => import("../views/reports/reportsPage"));
const PrivateRoute = lazy(() => import("./PrivateRoute"));
/*Pages Proeyecto Booths*/


const SamplePage = lazy(() => import('../views/sample-page/SamplePage'));
const Error = lazy(() => import('../views/authentication/NotFound'));
const Register = lazy(() => import('../views/authentication/Register'));
const Login = lazy(() => import('../views/authentication/Login'));
const TypographyPage = lazy(() => import('../views/utilities/TypographyPage'))
const Shadow = lazy(() => import('../views/utilities/Shadow'))

const BasicTable = lazy(() => import("../views/tables/BasicTable"));

const ExAutoComplete = lazy(() =>
  import("../views/form-elements/ExAutoComplete")
);
const ExButton = lazy(() => import("../views/form-elements/ExButton"));
const ExCheckbox = lazy(() => import("../views/form-elements/ExCheckbox"));
const ExRadio = lazy(() => import("../views/form-elements/ExRadio"));
const ExSlider = lazy(() => import("../views/form-elements/ExSlider"));
const ExSwitch = lazy(() => import("../views/form-elements/ExSwitch"));
const FormLayouts = lazy(() => import("../views/form-layouts/FormLayouts"));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', exact: true, element: <Navigate to="/auth/login" /> },
      {
        element: <PrivateRoute />,
        children: [
          /*Rutas Proyecto*/
          { path: '/dashboard', exact: true, element: <Dashboard /> },
          { path: '/users/listUsers', exact: true, element: <ListUsers /> },
          { path: '/profiles/listProfiles', exact: true, element: <ListProfiles /> },
          { path: '/employees/listEmployes', exact: true, element: <ListEmployes /> },
          { path: '/data_upload/uploadFile', exact: true, element: <DataUpload /> },
          { path: '/predictive_analysis/predictive_analysis', exact: true, element: <PredictiveAnalysis /> },
          { path: '/reports/reportsPage', exact: true, element: <Reports /> },
          /*Fin Rutas Proyecto*/
          { path: '/ui/typography', exact: true, element: <TypographyPage /> },
          { path: '/ui/shadow', exact: true, element: <Shadow /> },
          { path: '/sample-page', exact: true, element: <SamplePage /> },
          { path: "/tables/basic-table", element: <BasicTable /> },
          { path: "/form-layouts", element: <FormLayouts /> },
          { path: "/form-elements/autocomplete", element: <ExAutoComplete /> },
          { path: "/form-elements/button", element: <ExButton /> },
          { path: "/form-elements/checkbox", element: <ExCheckbox /> },
          { path: "/form-elements/radio", element: <ExRadio /> },
          { path: "/form-elements/slider", element: <ExSlider /> },
          { path: "/form-elements/switch", element: <ExSwitch /> },
        ],
      },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/auth/login', element: <Login /> },

    ],
  },
  { basename: '/' }
];

const router = createBrowserRouter(Router);
export default router;

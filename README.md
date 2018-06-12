# EHUServer

![Code style](https://camo.githubusercontent.com/1c5c800fbdabc79cfaca8c90dd47022a5b5c7486/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f636f64652532307374796c652d616972626e622d627269676874677265656e2e7376673f7374796c653d666c61742d737175617265)

Servidor del sistema de generación de calendarios personalizados [EHUCalendarGenerator](https://github.com/jcarral/EHUApp/wiki)

### Tabla de contenidos
1. [Primeros pasos](#primeros-pasos)
    1. [Prerequisitos](#prerequisitos)
    2. [Instalación](#instalación)
    3. [Compilar](#compilar)
4. [Contribución](#contribución)
5. [Autores](#autores)
6. [Licencia](#licencia)

## Primeros pasos
### Prerequisitos

* [Firebase Command Line Tools](https://github.com/firebase/firebase-tools)
* [NodeJS >= 9](https://nodejs.org/es/)
* [NPM](http://npmjs.com/) o [Yarn](https://yarnpkg.com/lang/en/)

### Instalación

Para poner en marcha el servidor en un entorno local, el primer paso es instalar las dependencias. Todo el contenido se encuentra en la carpeta `src`.

```
cd src && npm i
```

### Compilar 

Antes de subir el código a Firebase, se necesita generar una versión válida de este código. Para ello, desde la raíz del proyecto se tiene que ejecutar el siguiente comando:

```
npm run build
```

## Contribución

Por favor, ve al fichero [CONTRIBUTING.md](CONTRIBUTING.md) para leer con detalle como contribuir al proyecto.

## Autores

* **Joseba Carral** - *Autor* - [jcarral](https://github.com/jcarral)


## Licencia
Esta librería está bajo la licencia [MIT](./LICENSE.md)

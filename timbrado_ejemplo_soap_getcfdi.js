/**
 * Ejemplo de timbrado PHP del WS SOAP getCFDI() de SIFEI. * 
 * 
 * El CFDI(XML) debe estar sellado correctamente
 * Nota: Para simplificar los ejemplos todas las rutas son relativas y los datos se leen de un archivo config.ini, lo cual no debe de hacerse en un ambiente de produccion.
 * Los datos de pruebas y produccion son distintos, deberas solicitar primero tus datos de pruebas y una vez finalizadas tus pruebas deberas reemplazar tus accesos y URL de Ws service.
 */
var soap = require('soap');
var fs = require('fs');
var ini = require('ini')
var unzipper= require('unzipper')
var path = require('path');


//cargamos los accesos desde un almacenamiento seguro, en este caso para facilitar el ejemplo se lee desde un archivo .ini
var config=ini.parse(fs.readFileSync('./config.ini','utf-8'));
var usuario=config.timbrado.UsuarioSIFEI;
var password=config.timbrado.PasswordSIFEI;
var idEquipo=config.timbrado.IdEquipoGenerado;



//leemos el XML desde un archivo local,nota, la library propuesta no detecta que tipo requerido para archivoXMLZip es un binario y no lo codifica a base 64 
//por lo que se debe de realizar
cfdi= fs.readFileSync('./assets/cfdi.xml','utf-8');
let cfdiBase64=( Buffer.from(cfdi,'utf-8')).toString('base64');
//console.log(cfdi)
//URL de pruebas
var url = 'http://devcfdi.sifei.com.mx:8080/SIFEI33/SIFEI?wsdl';

//preparamos los parametros de timbrado
var parametrosDeTimbrado = {
    Usuario: usuario,   //usuario de sifei
    Password:password , //contraseña
    IdEquipo: idEquipo, //id de equipo
    archivoXMLZip: cfdiBase64, //archivo CFDI
    Serie:"" ,
};
soap.createClient(url, function(err, client) {
   
   console.log(JSON.stringify(client.describe()))//con esta linea averguaguamos los metodos
    //invamos metodo de timbrado:
   client.getCFDI(parametrosDeTimbrado,function(err,res,rawSoapResponse,soapResponseHeader,rawSoapRequest){
        //#En ambiente de pruebas mandamos el requets y response  a un archivo respecticamente para inspeccionarlos en caso de error, se asigna un timestamp para identificarlos:
        let timestamp=(new Date()).getTime()
        
        fs.writeFileSync(`./tmp/timbrado_response_${timestamp}.xml`,rawSoapResponse)
        fs.writeFileSync(`./tmp/timbrado_request_${timestamp}.xml`,rawSoapRequest)

        //ahora continuamos con el flujo normal
        if(err){
           //ocurrio un error , se debe leer la excepcion de sifei para ver cual es el error en el XML            
           console.error("error")
           //mensaje de error
           console.error(err.message)
           //excepcion completa(es un JSON tranformado):
            /**
             * {
                    codigo: 'XX',
                    error: 'XXXX',
                    message: 'XXXX'
                }
             */
           console.error(err.root.Envelope.Body.Fault.detail.SifeiException)
        }else{
            console.debug("ok")
           //Podemos extraer el cfdi timbrado  (viene dentro de un zip) 
          // console.log(res)
            let zipP='./tmp/timbrado.zip';
            let timbradoDir=path.dirname(zipP).split(path.sep).pop()
            //la respuesta vieene en el return
            fs.writeFileSync(zipP,res.return,{
              encoding:'base64'  
            })  
            //ahora debemos leer el zip y extraer los archivos(solo es el XML timbrado)
            fs.createReadStream(zipP)
                .pipe(unzipper.Extract({
                    path:timbradoDir
                }))
            console.log("Archivos extraidos")
        }
   })
});
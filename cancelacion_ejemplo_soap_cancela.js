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
var pfxPath=config.timbrado.PFX;
passwordPfx ="a0123456789"


//leemos el XML desde un archivo local,nota, la library propuesta no detecta que tipo requerido para archivoXMLZip es un binario y no lo codifica a base 64 
//por lo que se debe de realizar
pfxBuffer= fs.readFileSync(pfxPath);
let pfxBase64=pfxBuffer.toString('base64');
//console.log(cfdi)
//URL de pruebas
var url = 'http://devcfdi.sifei.com.mx:8888/CancelacionSIFEI/Cancelacion?wsdl';

//preparamos los parametros de timbrado
var parametrosDeCancelacion = {
      usuarioSIFEI: usuario,   //usuario de sifei
      passwordSifei: password , //contraseña
      rfcEmisor: 'RFC', //
      pfx: pfxBase64, //pfx en base64
      passwordPfx: passwordPfx, //password del pfx
      uuids:"uuid a cancelar" ,
};
soap.createClient(url, function(err, client) {
   
   console.log((client.describe()))//con esta linea averguaguamos los metodos
   console.log(JSON.stringify(client.describe().Cancelacion.CancelacionPort.cancelaCFDI))//con esta linea averguaguamos los metodos
     //invamos metodo de cancelaCFDI:
   client.Cancelacion.CancelacionPort.cancelaCFDI(parametrosDeCancelacion,function(err,res,rawSoapResponse,soapResponseHeader,rawSoapRequest){
        //#En ambiente de pruebas mandamos el requets y response  a un archivo respecticamente para inspeccionarlos en caso de error, se asigna un timestamp para identificarlos:
        let timestamp=(new Date()).getTime()
        
        fs.writeFileSync(`./tmp/cancelacion_response_${timestamp}.xml`,rawSoapResponse)
        fs.writeFileSync(`./tmp/cancelacion_request_${timestamp}.xml`,rawSoapRequest)

        //ahora continuamos con el flujo normal
        if(err){
           //ocurrio un error , se debe leer la excepcion de sifei para ver cual es el error en el XML            
           console.error("error")
           //mensaje de error
           console.error(err.message)
            
           console.error(err.root.Envelope.Body.Fault.detail.SifeiException)
        }else{
             
             fs.writeFileSync(`./tmp/acuse_cancelacion_${timestamp}.xml`,res.return)
        }
   })
});
var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectId = require('mongodb').ObjectID,
    fs = require('fs');

var app = express();

// body-parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(multiparty());

app.use((req,res,next)=>{
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);
    
    next();
});

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost',27017,{}),
    {}
);

console.log('Servidor HTTP esta escutando na porta ' + port);

app.get('/', function(req, res){
    res.send({msg:'Olá'});
});

// POST(create)
app.post('/api', function(req, res){

    var date = new Date();
    time_stamp = date.getTime();

    urlImagem = time_stamp + req.files.arquivo.originalFilename;

    var origem = req.files.arquivo.path;
    var destino = './uploads/' + urlImagem;

    

    fs.rename(origem,destino,(err)=>{
        if(err){
            res.status(500).json({error: err});
            return;
        }

        var dados = {
            url: urlImagem,
            titulo: req.body.titulo
        }

        db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.insert(dados, function(err, records){
                if(err){
                    res.json({'status': 'erro'});
                }else{
                    res.json({'status': 'inclusao realizada com sucesso'});
                }
                mongoclient.close();
            });
        });
        });
    });
});

// GET(ready)
app.get('/api', function(req, res){

    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find().toArray(function(err, results){
                if(err){
                    res.json(err);
                }else{
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });
});

app.get('/uploads/:imagem',function(req,res){
    var img = req.params.imagem;

    fs.readFile('./uploads/' + img,(err, conteudo)=>{
        if(err){
            res.status(400).json(err);
            return;
        }
        res.writeHead(200, {'Content-type': 'image/jpg'});
        res.end(conteudo);
    });
});
// GET by ID(ready)
app.get('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.find(objectId(req.params.id)).toArray(function(err, results){
                if(err){
                    res.json(err);
                }else{
                    res.status(200).json(results);
                }
                mongoclient.close();
            });
        });
    });
});

// PUT by ID(update)
app.put('/api/:id', function(req, res){
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                { _id : objectId(req.params.id) },
                { $push : { comentarios:{idComentario: new objectId(),comentario : req.body.comentario}}},
                {},
                function(err, records){
                    if(err){
                        res.json(err);
                    }else{
                        res.json(records);
                    }
                    mongoclient.close();
                }
            );
        });
    });
});

// DELETE by ID(delete)
app.delete('/api/:id', function(req, res){
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                {},
                { $pull : { comentarios:{idComentario: objectId(req.params.id)}}},
                {multi: true},
                function(err, records){
                    if(err){
                        res.json(err);
                    }else{
                        res.json(records);
                    }
                    mongoclient.close();
                }
            );
        });
    });
    
});
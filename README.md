# boatrec-admin

## Instructions:

#### unzip your database wallet to `/usr/lib/oracle/18.3/client64/lib/wallets/`

#### as instructed in the ATP-HOL-Long-v1.2-JT-pp.pdf (page 82) for the files 
`ojdbc.properties` and `sqlnet.ora` set the `DIRECTORY="/usr/lib/oracle/18.3/client64/lib/wallets/"`

#### build the adw/atp base image, f.ex. 
```docker build . -t boatrec-adw-base:1.0 -f Dockerfile-adw-base```

#### to build your NodeJS application modify the Dockerfile (line 1) to match your base image, e.g.
```FROM boatrec-adw-base:1.0```

##### this example uses OCIR to store the base image i.e. FROM fra.ocir.io/oracsmnorthuk/boatrec-adw-base:1.0

#### build the application image, e.g.
```docker build . -t boatrec-admin:1.0```

#### run the application, e.g.
```docker run -it -p 3000:3000 boatrec-admin:1.0```

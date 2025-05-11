```shell
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket
aws --endpoint-url=http://localhost:4566 s3 cp --recursive /lipsum/images-random/ s3://my-bucket/images-random/
aws --endpoint-url=http://localhost:4566 s3 ls --recursive s3://my-bucket/
```

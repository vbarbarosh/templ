### Allow Docker Containers to Access Host Services

```shell
sudo ufw enable
sudo ufw allow from 172.17.0.0/16 to 172.17.0.1 port 3306
sudo ufw allow from 172.17.0.0/16 to 172.17.0.1 port 6379
sudo ufw status numbered
```

### Configure the default bridge IP range

Edit or create `/etc/docker/daemon.json`:

```
{
  "bip": "172.17.0.1/30",
  "default-address-pools": [
    {
      "base": "172.17.0.0/16",
      "size": 22
    }
  ]
}
```

Then restart docker daemon:

```shell
sudo systemctl restart docker
```

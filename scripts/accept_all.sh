#!bin/sh

iptables -F
iptables -t nat -F
iptables -t mangle -F
iptables -P OUTPUT ACCEPT
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
echo All accepted!!!

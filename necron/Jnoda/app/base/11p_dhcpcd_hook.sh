#!bin/sh
if [ "$reason" == "BOUND" ]
then
	echo "new_domain_name_servers" $new_domain_name_servers
	DNS='[';
        CN="0";
		for i in $new_domain_name_servers; do
			echo "$0: Adding DNS $i"
			#echo CN $CN
			if [ $CN != "0" ]
			then
			    DNS=$DNS','
			fi 
			
			DNS=$DNS\"$i\"
			let CN=CN+1
		done
        DNS=$DNS']';
	#echo DNS string $DNS
    result='{"if":"'$interface'","dns":'$DNS',"gw":"'$new_routers'","metric":"","ip":"'$new_ip_address'","mask":"'$new_subnet_cidr'","bcast":"'$new_broadcast_address'"}'
    echo $result>/var/run/$interface".dhcp"
    echo $0: Write string $result
fi


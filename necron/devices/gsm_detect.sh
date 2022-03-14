#!/bin/sh
#example sh gsm_detect.sh 1-1.3 2 2
port=$1
control=$2
data=$3
cdev=""
ddev=""
edrv=""
emac=""
eif=""
adev=""
#echo Get modem info
TMP_DIR='/run'
    #echo Port $1
    if [ -f /sys/bus/usb/devices/$port/idVendor -a -f /sys/bus/usb/devices/$port/idProduct ];
    then
		    if [ -n "$control" -a -n "$data" ]; then
		        ttys=$(ls -d /sys/bus/usb/devices/$port/${port}*/tty* | sed "s/.*\///g" | tr "\n" " ")
		        adev=$(echo $ttys|sed 's/ /","/g')
		 	 fi


	        net=$(find /sys/bus/usb/devices/$port/ -name net)
	        if [ -n "$net" ];then
	        	edriv=$(cat $net/../uevent|grep 'DRIVER='|awk -F= '{print $2}')
	        	#echo New edrv $edriv
	        	if [ -n "$edriv" ]; then
	        		edrv=$edriv
	        	fi


	        	#echo wwan $wwan

	        	macp=$(find $net -name address)
	        	#$(cat $wwan/address)
	        	if [ -n $macp ]; then
	        		mac=$(cat $macp)
	        		#echo New mac $mac
	        		emac=$mac
	        	fi  

	        	ifa=$(find /sys/bus/usb/devices/$port/*/net/ \( -name 'eth*' -o -name 'usb*' -o -name 'wwan*' \)|awk -F"/" '{print $NF}')
	    		if [ -n "$ifa" ]; then
			        eif=$ifa
				fi
	        fi
	fi
echo '{"adev":["'$adev'"],"edrv":"'$edrv'","emac":"'$emac'","eif":"'$eif'"}'

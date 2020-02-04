/// ONLINE
#if TEMPFILE
	if(!file_exists("temp") && !file_exists("temp.dat")){
		if(file_exists("tempOnline")){
			file_delete("tempOnline");
		}
		if(file_exists("tempOnline2")){
			file_delete("tempOnline2");
		}
	}
#endif
buffer_destroy(@buffer);
#if TEMPFILE
	if(!file_exists("tempOnline")){
#endif
socket_destroy(@socket);
udpsocket_destroy(@udpsocket);
#if TEMPFILE
	}
#endif

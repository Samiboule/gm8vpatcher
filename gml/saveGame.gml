/// ONLINE
if(room != rSelectStage){
	buffer_clear(%arg0.@buffer);
	@p = %arg1;
	#if PLAYER2
		if(!instance_exists(@p)){
			@p = %arg2;
		}
	#endif
	if(instance_exists(@p)){
		buffer_write_uint8(%arg0.@buffer, 5);
		if(@p == %arg1){
			buffer_write_uint8(%arg0.@buffer, 0);
		}else{
			buffer_write_uint8(%arg0.@buffer, 1);
		}
		buffer_write_int32(%arg0.@buffer, @p.x);
		buffer_write_float64(%arg0.@buffer, @p.y);
		buffer_write_int16(%arg0.@buffer, room);
		socket_write_message(%arg0.@socket, %arg0.@buffer);
	}
}
/// ONLINE
visible = @oRoom == room;
image_alpha = @alpha;
@p = %arg0;
#if PLAYER2
	if(!instance_exists(@p)){
		@p = %arg1;
	}
#endif
if(instance_exists(@p)){
	@dist = distance_to_object(@p);
	image_alpha = min(@alpha, @dist/100);
}

/// ONLINE
@f = @follower;
if(@f == %arg0 && !instance_exists(@f)){
	#if PLAYER2
		@f = %arg1;
	#endif
}
if(instance_exists(@f)){
	x = @f.x;
	y = @f.y;
}else{
	instance_destroy();
}
if(@fade){
	@fadeAlpha -= 0.02;
	if(@fadeAlpha <= 0){
		instance_destroy();
	}
}
@alpha = 1;
if(@follower != %arg0){
	visible = @follower.visible;
	@p = %arg0;
	#if PLAYER2
		@p = %arg1;
	#endif
	if(instance_exists(@p)){
		@dist = distance_to_object(@p);
		@alpha = @dist/100;
	}
}
@t -= 1;
if(@t < 0){
	@fade = true;
}

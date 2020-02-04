/// ONLINE
@xx = 20;
@yy = 20;
if(view_enabled && view_visible[0]){
	@xx += view_xview[0];
	@yy += view_yview[0];
}
@text = @name+" saved!";
@_alpha = draw_get_alpha();
@_color = draw_get_color();
draw_set_valign(fa_top);
draw_set_halign(fa_left);
draw_set_alpha(image_alpha);
#if STUDIO
	if(font_exists(3)){
		draw_set_font(3);
	}
#endif
#if not STUDIO
	draw_set_font(@ftOnlinePlayerName);
#endif
draw_set_color(c_black);
draw_text(@xx+1, @yy, @text);
draw_text(@xx, @yy+1, @text);
draw_text(@xx-1, @yy, @text);
draw_text(@xx, @yy-1, @text);
draw_set_color(c_white);
draw_text(@xx, @yy, @text);
draw_set_alpha(@_alpha);
draw_set_color(@_color);
if(font_exists(0)){
	draw_set_font(0);
}
draw_set_valign(fa_top);
draw_set_halign(fa_left);
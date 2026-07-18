module conv3x3_fixed_opt (
    input [7:0] p00, p01, p02,
    input [7:0] p10, p11, p12,
    input [7:0] p20, p21, p22,
    output [19:0] y
);

wire [19:0] t01;
wire [19:0] t10;
wire [19:0] t11_shift;
wire [19:0] t12;
wire [19:0] t21;

assign t01       = {12'b0, p01};
assign t10       = {12'b0, p10};
assign t11_shift = {11'b0, p11, 1'b0};   // µÈ¼ÛÓÚ p11 << 1
assign t12       = {12'b0, p12};
assign t21       = {12'b0, p21};

assign y = t01 + t10 + t11_shift + t12 + t21;

endmodule
module avg_pool2x2_u8 (
    input  [7:0] a,
    input  [7:0] b,
    input  [7:0] c,
    input  [7:0] d,
    output [7:0] y
);

wire [8:0] sum0;
wire [8:0] sum1;
wire [9:0] sum;

add8u u_add0 (.a(a), .b(b), .y(sum0));
add8u u_add1 (.a(c), .b(d), .y(sum1));

assign sum = {1'b0, sum0} + {1'b0, sum1};

div4_u10 u_div4 (
    .x(sum),
    .y(y)
);

endmodule